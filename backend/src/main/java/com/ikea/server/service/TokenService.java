package com.ikea.server.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.ikea.server.constant.SecurityConstants;
import com.ikea.server.entity.UserToken;
import com.ikea.server.mapper.UserTokenMapper;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HexFormat;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TokenService {

  private static final SecureRandom RANDOM = new SecureRandom();

  private final UserTokenMapper tokenMapper;
  private final long refreshTokenTtlSeconds;

  public TokenService(
      UserTokenMapper tokenMapper,
      @Value("${ikea.auth.refresh-token-ttl:2592000}") long refreshTokenTtlSeconds) {
    this.tokenMapper = tokenMapper;
    this.refreshTokenTtlSeconds = refreshTokenTtlSeconds;
  }

  @Transactional
  public String issueRefreshToken(Long userId) {
    String raw = randomHex(48);
    UserToken token = new UserToken();
    token.setUserId(userId);
    token.setTokenHash(sha256(raw));
    token.setTokenType(SecurityConstants.TOKEN_TYPE_REFRESH);
    token.setExpiresAt(
        LocalDateTime.now(ZoneOffset.UTC).plusSeconds(refreshTokenTtlSeconds));
    token.setRevoked(0);
    tokenMapper.insert(token);
    return raw;
  }

  public Optional<UserToken> verifyRefreshToken(String rawToken) {
    if (rawToken == null || rawToken.isBlank()) {
      return Optional.empty();
    }
    String hash = sha256(rawToken);
    UserToken token =
        tokenMapper.selectOne(
            Wrappers.lambdaQuery(UserToken.class)
                .eq(UserToken::getTokenHash, hash)
                .eq(UserToken::getTokenType, SecurityConstants.TOKEN_TYPE_REFRESH)
                .eq(UserToken::getRevoked, 0));
    if (token == null
        || token.getExpiresAt().isBefore(LocalDateTime.now(ZoneOffset.UTC))) {
      return Optional.empty();
    }
    return Optional.of(token);
  }

  @Transactional
  public void delete(UserToken token) {
    if (token != null && token.getId() != null) {
      tokenMapper.deleteById(token.getId());
    }
  }

  @Transactional
  public void revokeAllForUser(Long userId) {
    if (userId == null) {
      return;
    }
    tokenMapper.update(
        null,
        new LambdaUpdateWrapper<UserToken>()
            .eq(UserToken::getUserId, userId)
            .eq(UserToken::getRevoked, 0)
            .set(UserToken::getRevoked, 1)
            .set(UserToken::getUpdatedAt, LocalDateTime.now(ZoneOffset.UTC)));
  }

  private static String randomHex(int bytes) {
    byte[] buffer = new byte[bytes];
    RANDOM.nextBytes(buffer);
    return HexFormat.of().formatHex(buffer);
  }

  private static String sha256(String value) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      return HexFormat.of()
          .formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException ex) {
      throw new IllegalStateException(ex);
    }
  }
}
