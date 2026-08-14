package com.ikea.server.config;

import com.ikea.server.constant.SecurityConstants;
import com.ikea.server.entity.AppUser;
import com.ikea.server.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** 启动时创建本地演示账号，保持与旧版文档一致。 */
@Component
public class DemoUserInitializer implements ApplicationRunner {

  private static final Logger log = LoggerFactory.getLogger(DemoUserInitializer.class);

  private final UserService userService;
  private final PasswordEncoder passwordEncoder;

  public DemoUserInitializer(UserService userService, PasswordEncoder passwordEncoder) {
    this.userService = userService;
    this.passwordEncoder = passwordEncoder;
  }

  @Override
  public void run(ApplicationArguments args) {
    if (userService.existsByAccount("demo@ikea.cn")
        || userService.findByPhone("13800138000").isPresent()) {
      return;
    }

    AppUser user = new AppUser();
    user.setUsername("demo@ikea.cn");
    user.setName("BUZUD 体验用户");
    user.setPhone("13800138000");
    user.setEmail("demo@ikea.cn");
    user.setPasswordHash(passwordEncoder.encode("123456"));
    user.setRole(SecurityConstants.ROLE_CUSTOMER);
    user.setStatus(1);
    userService.save(user);
    log.info("Seeded demo user: demo@ikea.cn / 13800138000, password 123456");
  }
}
