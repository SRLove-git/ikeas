package com.ikea.server.config;

import java.util.Arrays;
import java.nio.file.Path;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

  private final String[] allowedOrigins;
  private final String publicDir;

  public WebConfig(
      @Value("${ikea.cors.allowed-origins:http://localhost:3000,http://localhost:3001}")
          String allowedOrigins,
      @Value("${ikea.static.public-dir:}") String publicDir) {
    this.allowedOrigins =
        Arrays.stream(allowedOrigins.split(","))
            .map(String::trim)
            .filter(origin -> !origin.isEmpty())
            .toArray(String[]::new);
    this.publicDir = publicDir;
    if (publicDir != null && !publicDir.isBlank()) {
      System.out.println("[ikea-server] static public dir: "
          + Path.of(publicDir).toAbsolutePath().normalize());
    }
  }

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry
        .addMapping("/api/**")
        .allowedOrigins(allowedOrigins)
        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
        .allowedHeaders("*")
        .allowCredentials(true);
  }

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    if (publicDir == null || publicDir.isBlank()) {
      return;
    }
    String location = "file:" + Path.of(publicDir).toAbsolutePath() + "/";
    registry.addResourceHandler("/images/**", "/seo/**", "/fonts/**").addResourceLocations(location);
  }
}
