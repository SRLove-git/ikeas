package com.ikea.server.web;

import com.ikea.server.data.UserStore;
import com.ikea.server.data.UserStore.StoredUser;
import com.ikea.server.model.User;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

  private final UserStore userStore;

  public AuthController(UserStore userStore) {
    this.userStore = userStore;
  }

  public record SmsSendRequest(String phone) {}

  public record SmsSendResponse(String message, String devCode) {}

  public record SmsLoginRequest(String phone, String code) {}

  public record LoginRequest(String account, String password) {}

  public record RegisterRequest(String account, String password, String name) {}

  public record AuthResponse(String token, User user) {}

  public record MessageResponse(String message) {}

  @PostMapping("/sms/send")
  public SmsSendResponse sendSmsCode(@RequestBody SmsSendRequest request) {
    String devCode = userStore.sendSmsCode(request.phone());
    return new SmsSendResponse("验证码已发送", devCode);
  }

  @PostMapping("/sms/login")
  public AuthResponse smsLogin(@RequestBody SmsLoginRequest request) throws IOException {
    StoredUser user = userStore.smsLogin(request.phone(), request.code());
    return respond(user);
  }

  @PostMapping("/login")
  public AuthResponse login(@RequestBody LoginRequest request) {
    return respond(userStore.authenticate(request.account(), request.password()));
  }

  @PostMapping("/register")
  public AuthResponse register(@RequestBody RegisterRequest request) throws IOException {
    return respond(userStore.register(request.account(), request.password(), request.name()));
  }

  @GetMapping("/me")
  public User me(HttpServletRequest request) {
    String userId = (String) request.getAttribute(AuthInterceptor.USER_ID_ATTRIBUTE);
    StoredUser user = userStore.findById(userId);
    if (user == null) {
      throw new UnauthorizedException("请先登录");
    }
    return toUser(user);
  }

  @PostMapping("/logout")
  public MessageResponse logout(HttpServletRequest request) {
    userStore.revokeToken((String) request.getAttribute(AuthInterceptor.TOKEN_ATTRIBUTE));
    return new MessageResponse("已退出登录");
  }

  private AuthResponse respond(StoredUser user) {
    return new AuthResponse(userStore.issueToken(user.id()), toUser(user));
  }

  private static User toUser(StoredUser user) {
    return new User(user.id(), user.name(), user.phone(), user.email(), user.createdAt());
  }
}
