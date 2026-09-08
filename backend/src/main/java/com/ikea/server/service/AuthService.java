package com.ikea.server.service;

import com.ikea.server.constant.SecurityConstants;
import com.ikea.server.dto.auth.AuthResponse;
import com.ikea.server.dto.auth.LoginRequest;
import com.ikea.server.dto.auth.RegisterRequest;
import com.ikea.server.dto.auth.ResetPasswordRequest;
import com.ikea.server.entity.AppUser;
import com.ikea.server.entity.UserToken;
import com.ikea.server.model.User;
import java.time.Instant;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

  private static final Pattern PHONE = Pattern.compile("^[89]\\d{7}$");
  private static final Pattern EMAIL =
      Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
  private final UserService userService;
  private final TokenService tokenService;
  private final EmailCodeService emailCodeService;
  private final ReferralService referralService;
  private final PasswordEncoder passwordEncoder;
  private final JwtEncoder jwtEncoder;
  private final long accessTokenTtlSeconds;

  public AuthService(
      UserService userService,
      TokenService tokenService,
      EmailCodeService emailCodeService,
      ReferralService referralService,
      PasswordEncoder passwordEncoder,
      JwtEncoder jwtEncoder,
      @Value("${ikea.auth.access-token-ttl:900}") long accessTokenTtlSeconds) {
    this.userService = userService;
    this.tokenService = tokenService;
    this.emailCodeService = emailCodeService;
    this.referralService = referralService;
    this.passwordEncoder = passwordEncoder;
    this.jwtEncoder = jwtEncoder;
    this.accessTokenTtlSeconds = accessTokenTtlSeconds;
  }

  public String sendEmailCode(String email) {
    return emailCodeService.send(email);
  }

  @Transactional
  public AuthResponse register(RegisterRequest request) {
    String account = UserService.normalizeAccount(request.account());
    if (account == null) {
      throw new IllegalArgumentException("账号不能为空");
    }
    if (PHONE.matcher(account).matches()) {
      throw new IllegalArgumentException("请使用邮箱或用户名注册");
    }
    String verificationEmail = resolveVerificationEmail(account, request.email());
    emailCodeService.verifyAndConsume(verificationEmail, request.emailCode());
    if (userService.existsByAccount(account)) {
      throw new IllegalArgumentException("账号已存在: " + request.account());
    }
    if (userService.existsByEmail(verificationEmail)) {
      throw new IllegalArgumentException("该邮箱已注册");
    }

    AppUser user = new AppUser();
    user.setUsername(account);
    user.setName(
        request.name() == null || request.name().isBlank()
            ? defaultDisplayName(account)
            : request.name().trim());
    user.setEmail(verificationEmail);
    user.setPasswordHash(passwordEncoder.encode(request.password()));
    user.setRole(SecurityConstants.ROLE_CUSTOMER);
    user.setStatus(1);
    userService.save(user);
    referralService.recordReferral(request.referralCode(), user.getId());
    return issueTokenPair(user);
  }

  public AuthResponse login(LoginRequest request) {
    String account = UserService.normalizeAccount(request.account());
    if (account == null) {
      throw new AuthException("账号不能为空");
    }
    if (PHONE.matcher(account).matches()) {
      throw new AuthException("请使用邮箱或用户名登录");
    }
    AppUser user =
        userService
            .findByAccount(account)
            .orElseThrow(() -> new AuthException("账号或密码错误"));
    if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
      throw new AuthException("账号或密码错误");
    }
    ensureActive(user);
    return issueTokenPair(user);
  }

  @Transactional
  public void resetPassword(ResetPasswordRequest request) {
    String email = UserService.normalizeAccount(request.email());
    if (email == null || !EMAIL.matcher(email).matches()) {
      throw new IllegalArgumentException("邮箱格式不正确");
    }
    emailCodeService.verifyAndConsume(email, request.emailCode());
    AppUser user =
        userService
            .findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("该邮箱未注册"));
    user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
    userService.save(user);
  }

  public AuthResponse refresh(String refreshToken) {
    UserToken token =
        tokenService
            .verifyRefreshToken(refreshToken)
            .orElseThrow(() -> new AuthException("刷新令牌无效或已过期"));
    AppUser user =
        userService
            .findById(token.getUserId())
            .orElseThrow(() -> new AuthException("用户不存在"));
    ensureActive(user);
    tokenService.delete(token);
    return issueTokenPair(user);
  }

  public User me(Long userId) {
    AppUser user =
        userService.findById(userId).orElseThrow(() -> new AuthException("请先登录"));
    ensureActive(user);
    return toUser(user);
  }

  public void logout(Long userId) {
    if (userId != null) {
      tokenService.revokeAllForUser(userId);
    }
  }

  private AuthResponse issueTokenPair(AppUser user) {
    String accessToken = createAccessToken(user);
    String refreshToken = tokenService.issueRefreshToken(user.getId());
    return new AuthResponse(
        accessToken,
        refreshToken,
        accessTokenTtlSeconds,
        "Bearer",
        toUser(user));
  }

  private String createAccessToken(AppUser user) {
    Instant now = Instant.now();
    JwtClaimsSet claims =
        JwtClaimsSet.builder()
            .issuer("buzud")
            .issuedAt(now)
            .expiresAt(now.plusSeconds(accessTokenTtlSeconds))
            .subject(user.getId().toString())
            .claim("username", user.getUsername())
            .claim("role", user.getRole())
            .build();
    JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
    return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
  }

  private static void ensureActive(AppUser user) {
    if (!Integer.valueOf(1).equals(user.getStatus())) {
      throw new AuthException("账号已停用");
    }
  }

  private static User toUser(AppUser user) {
    return new User(
        user.getId().toString(),
        user.getName() == null || user.getName().isBlank()
            ? defaultDisplayName(user.getUsername())
            : user.getName(),
        user.getPhone(),
        user.getEmail(),
        user.getCreatedAt() == null ? null : user.getCreatedAt().toString());
  }

  private static String resolveVerificationEmail(String account, String email) {
    if (EMAIL.matcher(account).matches()) {
      return account;
    }
    String normalizedEmail = UserService.normalizeAccount(email);
    if (normalizedEmail == null || !EMAIL.matcher(normalizedEmail).matches()) {
      throw new IllegalArgumentException("请填写注册邮箱");
    }
    return normalizedEmail;
  }

  private static String defaultDisplayName(String account) {
    if (account == null || account.isBlank()) {
      return "用户";
    }
    return account;
  }
}
