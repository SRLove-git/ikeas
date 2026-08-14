package com.ikea.server.web.security;

import com.ikea.server.constant.SecurityConstants;
import com.ikea.server.entity.AppUser;
import com.ikea.server.service.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** 解析 Bearer JWT，并把用户 id 与 token 写入 request attribute。 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private final JwtDecoder jwtDecoder;
  private final UserService userService;

  public JwtAuthenticationFilter(JwtDecoder jwtDecoder, UserService userService) {
    this.jwtDecoder = jwtDecoder;
    this.userService = userService;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    String token = resolveToken(request);
    if (token == null) {
      filterChain.doFilter(request, response);
      return;
    }

    try {
      Jwt jwt = jwtDecoder.decode(token);
      Long userId = Long.valueOf(jwt.getSubject());
      AppUser user = userService.findById(userId).orElse(null);
      if (user == null) {
        request.setAttribute(SecurityConstants.JWT_ERROR_ATTRIBUTE, "登录状态无效，请重新登录");
        SecurityContextHolder.clearContext();
        filterChain.doFilter(request, response);
        return;
      }
      if (!userService.isActive(user)) {
        request.setAttribute(SecurityConstants.JWT_ERROR_ATTRIBUTE, "账号已停用");
        SecurityContextHolder.clearContext();
        filterChain.doFilter(request, response);
        return;
      }

      request.setAttribute(SecurityConstants.USER_ID_ATTRIBUTE, userId.toString());
      request.setAttribute(SecurityConstants.TOKEN_ATTRIBUTE, token);

      List<SimpleGrantedAuthority> authorities =
          List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole()));
      UsernamePasswordAuthenticationToken authentication =
          new UsernamePasswordAuthenticationToken(userId, null, authorities);
      authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
      SecurityContextHolder.getContext().setAuthentication(authentication);
    } catch (JwtException | IllegalArgumentException ex) {
      request.setAttribute(SecurityConstants.JWT_ERROR_ATTRIBUTE, "登录已过期，请重新登录");
      SecurityContextHolder.clearContext();
    }

    filterChain.doFilter(request, response);
  }

  private static String resolveToken(HttpServletRequest request) {
    String header = request.getHeader(HttpHeaders.AUTHORIZATION);
    if (header == null || !header.startsWith("Bearer ")) {
      return null;
    }
    return header.substring("Bearer ".length()).trim();
  }
}
