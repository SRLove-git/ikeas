package com.ikea.server.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Protects /api/v1/admin/** with a shared admin key sent as X-Admin-Key.
 * Configure via IKEA_ADMIN_KEY (default "ikea-admin" for local demo).
 */
@Component
public class AdminKeyInterceptor implements HandlerInterceptor {

  private final String adminKey;
  private final ObjectMapper mapper;

  public AdminKeyInterceptor(
      @Value("${ikea.admin.key:ikea-admin}") String adminKey, ObjectMapper mapper) {
    this.adminKey = adminKey == null || adminKey.isBlank() ? "ikea-admin" : adminKey;
    this.mapper = mapper;
  }

  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
      throws Exception {
    String provided = request.getHeader("X-Admin-Key");
    if (!adminKey.equals(provided)) {
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
                      "message", "管理密钥无效",
                      "path", request.getRequestURI())));
      return false;
    }
    return true;
  }
}
