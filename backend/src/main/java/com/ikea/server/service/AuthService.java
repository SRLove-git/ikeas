package com.ikea.server.service;

import com.ikea.server.constant.SecurityConstants;
import com.ikea.server.dto.auth.AuthResponse;
import com.ikea.server.dto.auth.LoginRequest;
import com.ikea.server.dto.auth.RegisterRequest;
import com.ikea.server.dto.auth.SmsLoginRequest;
import com.ikea.server.entity.AppUser;
import com.ikea.server.entity.UserToken;
import com.ikea.server.model.User;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
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

  private static final Pattern PHONE = Pattern.compile("^1\\d{10}$");
  private static final Pattern EMAIL =
      Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
  private static final SecureRandom RANDOM = new SecureRandom();

  private final UserService userService;
  private final TokenService tokenService;
  private final SmsCodeService smsCodeService;
  private final PasswordEncoder passwordEncoder;
  private final JwtEncoder jwtEncoder;
  private final long accessTokenTtlSeconds;

  public AuthService(
      UserService userService,
      TokenService tokenService,
      SmsCodeService smsCodeService,
      PasswordEncoder passwordEncoder,
      JwtEncoder jwtEncoder,
      @Value("${ikea.auth.access-token-ttl:900}") long accessTokenTtlSeconds) {
    this.userService = userService;
    this.tokenService = tokenService;
    this.smsCodeService = smsCodeService;
    this.passwordEncoder = passwordEncoder;
    this.jwtEncoder = jwtEncoder;
    this.accessTokenTtlSeconds = accessTokenTtlSeconds;
  }

  public String sendSmsCode(String phone) {
    return smsCodeService.send(phone);
  }

  @Transactional
  public AuthResponse register(RegisterRequest request) {
    String account = UserService.normalizeAccount(request.account());
    if (account == null) {
      throw new IllegalArgumentException("账号不能为空");
    }
    if (userService.existsByAccount(account)) {
      throw new IllegalArgumentException("账号已存在: " + request.account());
    }

    AppUser user = new AppUser();
    user.setUsername(account);
    user.setName(
        request.name() == null || request.name().isBlank()
            ? defaultDisplayName(account)
            : request.name().trim());
    if (PHONE.matcher(account).matches()) {
      user.setPhone(account);
    } else if (EMAIL.matcher(account).matches()) {
      user.setEmail(account);
    }
    user.setPasswordHash(passwordEncoder.encode(request.password()));
    user.setRole(SecurityConstants.ROLE_CUSTOMER);
    user.setStatus(1);
    userService.save(user);
    return issueTokenPair(user);
  }

  public AuthResponse login(LoginRequest request) {
    AppUser user =
        userService
            .findByAccount(request.account())
            .orElseThrow(() -> new AuthException("账号或密码错误"));
    if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
      throw new AuthException("账号或密码错误");
    }
    ensureActive(user);
    return issueTokenPair(user);
  }

  @Transactional
  public AuthResponse smsLogin(SmsLoginRequest request) {
    smsCodeService.verifyAndConsume(request.phone(), request.code());
    AppUser user =
        userService
            .findByPhone(request.phone())
            .orElseGet(() -> createPhoneUser(request.phone()));
    ensureActive(user);
    return issueTokenPair(user);
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

  private static String defaultDisplayName(String account) {
    if (account == null || account.isBlank()) {
      return "用户";
    }
    return PHONE.matcher(account).matches()
        ? "用户" + account.substring(account.length() - 4)
        : account;
  }

  private static String randomPassword() {
    byte[] bytes = new byte[12];
    RANDOM.nextBytes(bytes);
    return HexFormat.of().formatHex(bytes);
  }

  private AppUser createPhoneUser(String phone) {
    AppUser user = new AppUser();
    user.setUsername(phone);
    user.setName(defaultDisplayName(phone));
    user.setPhone(phone);
    user.setPasswordHash(passwordEncoder.encode(randomPassword()));
    user.setRole(SecurityConstants.ROLE_CUSTOMER);
    user.setStatus(1);
    userService.save(user);
    return user;
  }
}
