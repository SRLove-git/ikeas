package com.ikea.server.web;

import com.ikea.server.constant.SecurityConstants;
import com.ikea.server.dto.auth.AuthResponse;
import com.ikea.server.dto.auth.EmailCodeSendRequest;
import com.ikea.server.dto.auth.EmailCodeSendResponse;
import com.ikea.server.dto.auth.LoginRequest;
import com.ikea.server.dto.auth.MessageResponse;
import com.ikea.server.dto.auth.RefreshTokenRequest;
import com.ikea.server.dto.auth.RegisterRequest;
import com.ikea.server.dto.auth.ResetPasswordRequest;
import com.ikea.server.model.User;
import com.ikea.server.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/email/send")
  public EmailCodeSendResponse sendEmailCode(@Valid @RequestBody EmailCodeSendRequest request) {
    String devCode = authService.sendEmailCode(request.email());
    return new EmailCodeSendResponse("验证码已发送", devCode);
  }

  @PostMapping("/login")
  public AuthResponse login(@Valid @RequestBody LoginRequest request) {
    return authService.login(request);
  }

  @PostMapping("/password/reset")
  public MessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
    authService.resetPassword(request);
    return new MessageResponse("密码已重置，请使用新密码登录");
  }

  @PostMapping("/register")
  public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
    return authService.register(request);
  }

  @PostMapping("/refresh")
  public AuthResponse refresh(@Valid @RequestBody RefreshTokenRequest request) {
    return authService.refresh(request.refreshToken());
  }

  @GetMapping("/me")
  public User me(HttpServletRequest request) {
    return authService.me(userId(request));
  }

  @PostMapping("/logout")
  public MessageResponse logout(HttpServletRequest request) {
    authService.logout(userId(request));
    return new MessageResponse("已退出登录");
  }

  private static Long userId(HttpServletRequest request) {
    String value = (String) request.getAttribute(SecurityConstants.USER_ID_ATTRIBUTE);
    return value == null ? null : Long.valueOf(value);
  }
}
