package com.ikea.server.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ikea.server.data.UserStore;
import com.ikea.server.data.UserStore.StoredUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/** Validates Bearer tokens for protected endpoints and exposes the user id. */
@Component
public class AuthInterceptor implements HandlerInterceptor {

  public static final String USER_ID_ATTRIBUTE = "ikea.userId";
  public static final String TOKEN_ATTRIBUTE = "ikea.token";

  private final UserStore userStore;
  private final ObjectMapper mapper;

  public AuthInterceptor(UserStore userStore, ObjectMapper mapper) {
    this.userStore = userStore;
    this.mapper = mapper;
  }

  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
      throws Exception {
    String header = request.getHeader("Authorization");
    String token = null;
    if (header != null && header.startsWith("Bearer ")) {
      token = header.substring("Bearer ".length()).trim();
    }
    StoredUser user = userStore.userByToken(token);
    if (user == null) {
      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
      response.setCharacterEncoding(StandardCharsets.UTF_8.name());
      response.setContentType("application/json");
      response
          .getWriter()
          .write(
              mapper.writeValueAsString(
                  Map.of(
                      "status", 401,
                      "error", "Unauthorized",
                      "message", "请先登录",
                      "path", request.getRequestURI())));
      return false;
    }
    request.setAttribute(USER_ID_ATTRIBUTE, user.id());
    request.setAttribute(TOKEN_ATTRIBUTE, token);
    return true;
  }
}
