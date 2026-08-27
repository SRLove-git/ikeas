package com.ikea.server.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.ikea.server.entity.AppUser;
import com.ikea.server.mapper.AppUserMapper;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

  private static final Pattern PHONE = Pattern.compile("^[89]\\d{7}$");
  private static final Pattern EMAIL =
      Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

  private final AppUserMapper userMapper;

  public UserService(AppUserMapper userMapper) {
    this.userMapper = userMapper;
  }

  public Optional<AppUser> findById(Long userId) {
    return userId == null ? Optional.empty() : Optional.ofNullable(userMapper.selectById(userId));
  }

  public Optional<AppUser> findByAccount(String account) {
    String normalized = normalizeAccount(account);
    if (normalized == null) {
      return Optional.empty();
    }
    if (PHONE.matcher(normalized).matches()) {
      return findByPhone(normalized);
    }
    if (EMAIL.matcher(normalized).matches()) {
      return findByEmail(normalized);
    }
    return findByUsername(normalized);
  }

  public Optional<AppUser> findByUsername(String username) {
    String normalized = normalizeAccount(username);
    if (normalized == null) {
      return Optional.empty();
    }
    return Optional.ofNullable(
        userMapper.selectOne(
            Wrappers.lambdaQuery(AppUser.class).eq(AppUser::getUsername, normalized)));
  }

  public Optional<AppUser> findByEmail(String email) {
    String normalized = normalizeAccount(email);
    if (normalized == null) {
      return Optional.empty();
    }
    return Optional.ofNullable(
        userMapper.selectOne(
            Wrappers.lambdaQuery(AppUser.class).eq(AppUser::getEmail, normalized)));
  }

  public Optional<AppUser> findByPhone(String phone) {
    if (phone == null) {
      return Optional.empty();
    }
    return Optional.ofNullable(
        userMapper.selectOne(Wrappers.lambdaQuery(AppUser.class).eq(AppUser::getPhone, phone)));
  }

  public boolean existsByAccount(String account) {
    return findByAccount(account).isPresent();
  }

  public boolean existsByPhone(String phone) {
    return findByPhone(phone).isPresent();
  }

  public boolean existsByEmail(String email) {
    return findByEmail(email).isPresent();
  }

  public boolean existsByUsername(String username) {
    return findByUsername(username).isPresent();
  }

  public List<AppUser> listAll() {
    return userMapper.selectList(
        Wrappers.lambdaQuery(AppUser.class).orderByDesc(AppUser::getCreatedAt));
  }

  @Transactional
  public AppUser save(AppUser user) {
    userMapper.insert(user);
    return user;
  }

  @Transactional
  public boolean softDelete(Long userId) {
    if (userId == null) {
      return false;
    }
    return userMapper.deleteById(userId) > 0;
  }

  public boolean isActive(AppUser user) {
    return user != null && Integer.valueOf(1).equals(user.getStatus());
  }

  public static String normalizeAccount(String account) {
    if (account == null || account.isBlank()) {
      return null;
    }
    return account.trim().toLowerCase(Locale.ROOT);
  }
}
