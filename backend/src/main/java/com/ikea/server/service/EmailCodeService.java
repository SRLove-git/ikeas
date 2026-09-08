package com.ikea.server.service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/** 注册邮箱验证码：生成、发送（SMTP 未配置时仅记录开发验证码）、校验并消费。 */
@Service
public class EmailCodeService {

  private static final Logger log = LoggerFactory.getLogger(EmailCodeService.class);
  private static final SecureRandom RANDOM = new SecureRandom();
  private static final Pattern EMAIL =
      Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
  private static final long CODE_TTL_SECONDS = 5 * 60L;

  private record CodeEntry(String code, Instant expiresAt) {}

  private final Map<String, CodeEntry> codes = new ConcurrentHashMap<>();
  private final JavaMailSender mailSender;
  private final String smtpHost;
  private final String from;

  public EmailCodeService(
      JavaMailSender mailSender,
      @Value("${spring.mail.host:}") String smtpHost,
      @Value("${ikea.auth.email-from:CHUNG YIP <no-reply@medical-sg.com>}") String from) {
    this.mailSender = mailSender;
    this.smtpHost = smtpHost;
    this.from = from;
  }

  public String send(String email) {
    String normalized = normalizeEmail(email);
    if (normalized == null || !EMAIL.matcher(normalized).matches()) {
      throw new IllegalArgumentException("邮箱格式不正确");
    }

    String code = String.format("%06d", RANDOM.nextInt(1_000_000));
    codes.put(normalized, new CodeEntry(code, Instant.now().plusSeconds(CODE_TTL_SECONDS)));

    if (smtpHost == null || smtpHost.isBlank()) {
      log.warn("SMTP host is not configured; returning development code for {}", normalized);
      return code;
    }

    SimpleMailMessage message = new SimpleMailMessage();
    message.setFrom(from);
    message.setTo(normalized);
    message.setSubject("CHUNG YIP 注册验证码");
    message.setText(
        "您的 CHUNG YIP 注册验证码是："
            + code
            + "\n\n验证码 5 分钟内有效。如非本人操作，请忽略此邮件。");
    try {
      mailSender.send(message);
    } catch (RuntimeException ex) {
      log.error("Failed to send registration code email to {}", normalized, ex);
      codes.remove(normalized);
      throw new IllegalStateException("验证码邮件发送失败，请稍后重试", ex);
    }
    return null;
  }

  public void verifyAndConsume(String email, String code) {
    String normalized = normalizeEmail(email);
    if (normalized == null || !EMAIL.matcher(normalized).matches()) {
      throw new IllegalArgumentException("邮箱格式不正确");
    }
    CodeEntry stored = codes.remove(normalized);
    if (stored == null
        || stored.expiresAt().isBefore(Instant.now())
        || !stored.code().equals(code)) {
      throw new IllegalArgumentException("邮箱验证码错误或已过期");
    }
  }

  private static String normalizeEmail(String email) {
    if (email == null || email.isBlank()) {
      return null;
    }
    return email.trim().toLowerCase(Locale.ROOT);
  }
}
