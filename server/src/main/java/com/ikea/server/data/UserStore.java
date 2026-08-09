package com.ikea.server.data;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * In-memory user registry with optional file persistence, SMS codes and bearer
 * tokens. Seed account: demo@ikea.cn / 123456 (phone 13800138000 / 123456).
 */
@Component
public class UserStore {

  private static final Logger log = LoggerFactory.getLogger(UserStore.class);
  private static final SecureRandom RANDOM = new SecureRandom();
  private static final Pattern PHONE = Pattern.compile("^1\\d{10}$");
  private static final long SMS_TTL_MS = 5 * 60 * 1000L;

  public record StoredUser(
      String id,
      String name,
      String phone,
      String email,
      String passwordHash,
      String salt,
      String createdAt) {}

  private record SmsCode(String code, long expiresAt) {}

  private final ObjectMapper mapper;
  private final Path usersFile;
  private final boolean exposeSmsCode;
  private final Map<String, StoredUser> usersById = new ConcurrentHashMap<>();
  private final Map<String, String> idByAccount = new ConcurrentHashMap<>();
  private final Map<String, String> idByPhone = new ConcurrentHashMap<>();
  private final Map<String, String> tokenToUser = new ConcurrentHashMap<>();
  private final Map<String, SmsCode> smsCodes = new ConcurrentHashMap<>();

  public UserStore(
      ObjectMapper mapper,
      @Value("${ikea.auth.users-file:}") String usersFile,
      @Value("${ikea.auth.expose-sms-code:true}") boolean exposeSmsCode)
      throws IOException {
    this.mapper = mapper;
    this.usersFile =
        usersFile == null || usersFile.isBlank() ? null : Path.of(usersFile).toAbsolutePath().normalize();
    this.exposeSmsCode = exposeSmsCode;
    load();
    seedDemoUser();
  }

  // ---------------------------------------------------------- users

  public synchronized StoredUser register(String account, String password, String name)
      throws IOException {
    String normalized = normalizeAccount(account);
    if (idByAccount.containsKey(normalized) || idByPhone.containsKey(normalized)) {
      throw new IllegalArgumentException("账号已存在: " + account);
    }
    String id = UUID.randomUUID().toString();
    String salt = randomHex(16);
    String createdAt = OffsetDateTime.now().toString();
    boolean isPhone = PHONE.matcher(normalized).matches();
    String displayName =
        name == null || name.isBlank()
            ? "用户" + (isPhone ? normalized.substring(normalized.length() - 4) : normalized)
            : name;
    StoredUser user =
        new StoredUser(
            id,
            displayName,
            isPhone ? normalized : null,
            isPhone ? null : normalized,
            sha256(salt, password),
            salt,
            createdAt);
    usersById.put(id, user);
    idByAccount.put(normalized, id);
    if (isPhone) {
      idByPhone.put(normalized, id);
    }
    persist();
    return user;
  }

  public StoredUser authenticate(String account, String password) {
    StoredUser user = findByAccount(account);
    if (user == null || !sha256(user.salt(), password).equals(user.passwordHash())) {
      throw new IllegalArgumentException("账号或密码错误");
    }
    return user;
  }

  public StoredUser findByAccount(String account) {
    String id = idByAccount.get(normalizeAccount(account));
    return id == null ? null : usersById.get(id);
  }

  public StoredUser findById(String userId) {
    return userId == null ? null : usersById.get(userId);
  }

  /** All registered users, newest first (used by the admin panel). */
  public List<StoredUser> allUsers() {
    return usersById.values().stream()
        .sorted((a, b) -> b.createdAt().compareTo(a.createdAt()))
        .toList();
  }

  /** Removes a user together with their tokens (used by the admin panel). */
  public synchronized boolean deleteUser(String userId) {
    StoredUser user = usersById.remove(userId);
    if (user == null) {
      return false;
    }
    if (user.phone() != null) {
      idByPhone.remove(user.phone());
    }
    if (user.email() != null) {
      idByAccount.remove(normalizeAccount(user.email()));
    }
    tokenToUser.entrySet().removeIf(entry -> entry.getValue().equals(userId));
    try {
      persist();
    } catch (IOException ex) {
      log.warn("Failed to persist user deletion: {}", ex.getMessage());
    }
    return true;
  }

  // ----------------------------------------------------------- sms

  public String sendSmsCode(String phone) {
    if (!PHONE.matcher(phone).matches()) {
      throw new IllegalArgumentException("手机号格式不正确");
    }
    String code = String.format("%06d", RANDOM.nextInt(1_000_000));
    smsCodes.put(phone, new SmsCode(code, System.currentTimeMillis() + SMS_TTL_MS));
    return exposeSmsCode ? code : null;
  }

  public synchronized StoredUser smsLogin(String phone, String code) throws IOException {
    SmsCode stored = smsCodes.get(phone);
    if (stored == null || stored.expiresAt() < System.currentTimeMillis()) {
      throw new IllegalArgumentException("验证码错误或已过期");
    }
    if (!stored.code().equals(code)) {
      throw new IllegalArgumentException("验证码错误或已过期");
    }
    smsCodes.remove(phone);
    StoredUser user = findById(idByPhone.get(phone));
    if (user == null) {
      // First-time SMS login doubles as registration ("登录 / 注册").
      user = register(phone, randomHex(12), null);
    }
    return user;
  }

  // --------------------------------------------------------- tokens

  public String issueToken(String userId) {
    String token = UUID.randomUUID().toString().replace("-", "") + randomHex(16);
    tokenToUser.put(token, userId);
    return token;
  }

  public StoredUser userByToken(String token) {
    if (token == null) {
      return null;
    }
    return findById(tokenToUser.get(token));
  }

  public void revokeToken(String token) {
    if (token != null) {
      tokenToUser.remove(token);
    }
  }

  // ------------------------------------------------------- storage

  private void seedDemoUser() throws IOException {
    if (findByAccount("demo@ikea.cn") == null && idByPhone.get("13800138000") == null) {
      register("demo@ikea.cn", "123456", "宜家体验用户");
      log.info("Seeded demo user: demo@ikea.cn / 13800138000, password 123456");
    }
  }

  private void load() throws IOException {
    if (usersFile == null || !Files.isRegularFile(usersFile)) {
      return;
    }
    StoredUser[] users = mapper.readValue(usersFile.toFile(), StoredUser[].class);
    for (StoredUser user : users) {
      usersById.put(user.id(), user);
      if (user.phone() != null) {
        idByPhone.put(user.phone(), user.id());
      }
      if (user.email() != null) {
        idByAccount.put(normalizeAccount(user.email()), user.id());
      }
    }
    log.info("Loaded {} users from {}", users.length, usersFile);
  }

  private void persist() throws IOException {
    if (usersFile == null) {
      return;
    }
    Files.createDirectories(usersFile.getParent());
    mapper.writeValue(usersFile.toFile(), usersById.values());
  }

  // ------------------------------------------------------- helpers

  private static String normalizeAccount(String account) {
    if (account == null) {
      throw new IllegalArgumentException("账号不能为空");
    }
    return account.trim().toLowerCase();
  }

  private static String sha256(String salt, String value) {
    try {
      MessageDigest md = MessageDigest.getInstance("SHA-256");
      md.update(salt.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(md.digest(value.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException ex) {
      throw new IllegalStateException(ex);
    }
  }

  private static String randomHex(int bytes) {
    byte[] buffer = new byte[bytes];
    RANDOM.nextBytes(buffer);
    return HexFormat.of().formatHex(buffer);
  }
}
