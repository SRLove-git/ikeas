package com.ikea.server.web.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ikea.server.constant.SecurityConstants;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

  private final ObjectMapper mapper;

  public RestAuthenticationEntryPoint(ObjectMapper mapper) {
    this.mapper = mapper;
  }

  @Override
  public void commence(
      HttpServletRequest request,
      HttpServletResponse response,
      AuthenticationException authException)
      throws IOException, ServletException {
    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    response.setCharacterEncoding(StandardCharsets.UTF_8.name());
    response.setContentType("application/json");
    Object jwtError = request.getAttribute(SecurityConstants.JWT_ERROR_ATTRIBUTE);
    String message =
        jwtError == null || String.valueOf(jwtError).isBlank()
            ? "请先登录"
            : String.valueOf(jwtError);
    response
        .getWriter()
        .write(
            mapper.writeValueAsString(
                Map.of(
                    "status", 401,
                    "error", "Unauthorized",
                    "message", message,
                    "path", request.getRequestURI())));
  }
}
