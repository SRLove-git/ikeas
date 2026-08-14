package com.ikea.server.service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SmsCodeService {

  private static final SecureRandom RANDOM = new SecureRandom();
  private static final Pattern PHONE = Pattern.compile("^1\\d{10}$");
  private static final long SMS_TTL_SECONDS = 5 * 60L;

  private record CodeEntry(String code, Instant expiresAt) {}

  private final Map<String, CodeEntry> codes = new ConcurrentHashMap<>();
  private final boolean exposeSmsCode;

  public SmsCodeService(
      @Value("${ikea.auth.expose-sms-code:true}") boolean exposeSmsCode) {
    this.exposeSmsCode = exposeSmsCode;
  }

  public String send(String phone) {
    if (!PHONE.matcher(phone).matches()) {
      throw new IllegalArgumentException("手机号格式不正确");
    }
    String code = String.format("%06d", RANDOM.nextInt(1_000_000));
    codes.put(phone, new CodeEntry(code, Instant.now().plusSeconds(SMS_TTL_SECONDS)));
    return exposeSmsCode ? code : null;
  }

  public void verifyAndConsume(String phone, String code) {
    CodeEntry stored = codes.remove(phone);
    if (stored == null
        || stored.expiresAt().isBefore(Instant.now())
        || !stored.code().equals(code)) {
      throw new IllegalArgumentException("验证码错误或已过期");
    }
  }
}
