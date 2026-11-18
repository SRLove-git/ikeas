package com.ikea.server.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.baomidou.mybatisplus.core.conditions.AbstractWrapper;
import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.ikea.server.dto.auth.AuthResponse;
import com.ikea.server.dto.auth.SsoCodeResponse;
import com.ikea.server.entity.SsoCode;
import com.ikea.server.mapper.SsoCodeMapper;
import com.ikea.server.test.MybatisTestSupport;
import com.ikea.server.web.UnauthorizedException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HexFormat;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;

class SsoServiceTest {

  private SsoCodeMapper ssoCodeMapper;
  private AuthService authService;
  private SsoService service;

  @BeforeEach
  void setUp() {
    MybatisTestSupport.initTableInfo(SsoCode.class);
    ssoCodeMapper = mock(SsoCodeMapper.class);
    authService = mock(AuthService.class);
    service = new SsoService(ssoCodeMapper, authService);
  }

  @Test
  void issueCodeShouldPersistOnlyAHashWith120SecondTtl() {
    SsoCodeResponse response = service.issueCode(42L, "home");

    assertEquals(120, response.expiresIn());
    assertEquals(43, response.code().length());
    assertTrue(response.code().matches("[A-Za-z0-9_-]{43}"));

    ArgumentCaptor<SsoCode> captor = ArgumentCaptor.forClass(SsoCode.class);
    verify(ssoCodeMapper).insert(captor.capture());
    SsoCode stored = captor.getValue();
    assertEquals(42L, stored.getUserId());
    assertEquals("home", stored.getTarget());
    assertEquals(0, stored.getUsed());
    assertNotEquals(response.code(), stored.getCodeHash());
    assertEquals(sha256(response.code()), stored.getCodeHash());
    assertEquals(64, stored.getCodeHash().length());

    long ttlSeconds =
        Duration.between(LocalDateTime.now(ZoneOffset.UTC), stored.getExpiresAt()).toSeconds();
    assertTrue(ttlSeconds >= 117 && ttlSeconds <= 120, "unexpected ttl " + ttlSeconds);
  }

  @ParameterizedTest
  @NullAndEmptySource
  @ValueSource(strings = {"portal", "MEDICAL", " medical "})
  void issueCodeShouldRejectAnythingButMedicalOrHome(String target) {
    assertThrows(IllegalArgumentException.class, () -> service.issueCode(1L, target));
    verify(ssoCodeMapper, never()).insert(any(SsoCode.class));
  }

  @Test
  void issueCodeShouldRequireAnAuthenticatedUser() {
    assertThrows(UnauthorizedException.class, () -> service.issueCode(null, "home"));
    verifyNoInteractions(ssoCodeMapper);
  }

  @Test
  void exchangeShouldConsumeExactlyOnceAndIssueTokens() {
    SsoCode stored = new SsoCode();
    stored.setUserId(42L);
    stored.setTarget("home");
    when(ssoCodeMapper.selectOne(any())).thenReturn(stored);
    doReturn(1, 0).when(ssoCodeMapper).update(isNull(), any());
    AuthResponse tokens = new AuthResponse("access", "refresh", 900, "Bearer", null);
    when(authService.issueTokensForUser(42L)).thenReturn(tokens);

    assertEquals(tokens, service.exchange("raw-code"));
    assertThrows(IllegalArgumentException.class, () -> service.exchange("raw-code"));

    verify(authService, times(1)).issueTokensForUser(42L);

    @SuppressWarnings("unchecked")
    ArgumentCaptor<Wrapper<SsoCode>> captor = ArgumentCaptor.forClass(Wrapper.class);
    verify(ssoCodeMapper, times(2)).update(isNull(), captor.capture());
    AbstractWrapper<?, ?, ?> wrapper = (AbstractWrapper<?, ?, ?>) captor.getAllValues().get(0);
    String sql = wrapper.getSqlSegment();
    assertTrue(sql.contains("used"));
    assertTrue(sql.contains("expires_at"));
    assertTrue(wrapper.getParamNameValuePairs().containsValue(sha256("raw-code")));
    assertFalse(wrapper.getParamNameValuePairs().containsValue("raw-code"));
  }

  @Test
  void exchangeShouldRejectUnknownExpiredOrReusedCodesWithoutIssuingTokens() {
    doReturn(0).when(ssoCodeMapper).update(isNull(), any());

    IllegalArgumentException error =
        assertThrows(IllegalArgumentException.class, () -> service.exchange("unknown-code"));

    assertTrue(error.getMessage().contains("无效"));
    verifyNoInteractions(authService);
  }

  @ParameterizedTest
  @NullAndEmptySource
  @ValueSource(strings = {"   "})
  void exchangeShouldRejectBlankCodesBeforeTouchingTheDatabase(String code) {
    assertThrows(IllegalArgumentException.class, () -> service.exchange(code));
    verify(ssoCodeMapper, never()).update(any(), any());
    verifyNoInteractions(authService);
  }

  private static String sha256(String value) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      return HexFormat.of()
          .formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
    } catch (Exception ex) {
      throw new IllegalStateException(ex);
    }
  }
}
