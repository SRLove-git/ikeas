package com.ikea.server.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.ikea.server.constant.SalesChannel;
import com.ikea.server.dto.auth.AuthResponse;
import com.ikea.server.dto.auth.SsoCodeResponse;
import com.ikea.server.entity.SsoCode;
import com.ikea.server.mapper.SsoCodeMapper;
import com.ikea.server.web.UnauthorizedException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.HexFormat;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 跨站单点登录：已登录用户为另一站点生成一次性授权码，另一站点兑换新的令牌对。
 *
 * <p>授权码只以 SHA-256 哈希落库，120 秒内有效且只能消费一次。
 */
@Service
public class SsoService {

  static final int CODE_BYTES = 32;
  static final long CODE_TTL_SECONDS = 120;
  private static final String INVALID_CODE_MESSAGE = "SSO 授权码无效、已过期或已使用，请重新发起登录";
  private static final SecureRandom RANDOM = new SecureRandom();

  private final SsoCodeMapper ssoCodeMapper;
  private final AuthService authService;

  public SsoService(SsoCodeMapper ssoCodeMapper, AuthService authService) {
    this.ssoCodeMapper = ssoCodeMapper;
    this.authService = authService;
  }

  /** 为当前登录用户签发目标站点的一次性授权码。 */
  @Transactional
  public SsoCodeResponse issueCode(Long userId, String target) {
    if (userId == null) {
      throw new UnauthorizedException("请先登录");
    }
    if (!SalesChannel.isSupported(target)) {
      throw new IllegalArgumentException("target 仅支持 medical 或 home");
    }

    String rawCode = randomCode();
    LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);

    SsoCode entity = new SsoCode();
    entity.setCodeHash(sha256(rawCode));
    entity.setUserId(userId);
    entity.setTarget(target);
    entity.setExpiresAt(now.plusSeconds(CODE_TTL_SECONDS));
    entity.setUsed(0);
    ssoCodeMapper.insert(entity);

    return new SsoCodeResponse(rawCode, CODE_TTL_SECONDS);
  }

  /**
   * 原子消费授权码并签发令牌对：只有 used=0 且未过期时更新才会命中，
   * 并发或重复兑换最多成功一次。
   */
  @Transactional
  public AuthResponse exchange(String rawCode) {
    if (rawCode == null || rawCode.isBlank()) {
      throw new IllegalArgumentException(INVALID_CODE_MESSAGE);
    }
    String codeHash = sha256(rawCode.trim());
    LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);

    int consumed =
        ssoCodeMapper.update(
            null,
            Wrappers.lambdaUpdate(SsoCode.class)
                .eq(SsoCode::getCodeHash, codeHash)
                .eq(SsoCode::getUsed, 0)
                .gt(SsoCode::getExpiresAt, now)
                .set(SsoCode::getUsed, 1)
                .set(SsoCode::getUpdatedAt, now));
    if (consumed != 1) {
      throw new IllegalArgumentException(INVALID_CODE_MESSAGE);
    }

    SsoCode consumedCode =
        ssoCodeMapper.selectOne(
            Wrappers.lambdaQuery(SsoCode.class).eq(SsoCode::getCodeHash, codeHash));
    if (consumedCode == null || consumedCode.getUserId() == null) {
      throw new IllegalArgumentException(INVALID_CODE_MESSAGE);
    }
    return authService.issueTokensForUser(consumedCode.getUserId());
  }

  private static String randomCode() {
    byte[] buffer = new byte[CODE_BYTES];
    RANDOM.nextBytes(buffer);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(buffer);
  }

  private static String sha256(String value) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException ex) {
      throw new IllegalStateException(ex);
    }
  }
}
