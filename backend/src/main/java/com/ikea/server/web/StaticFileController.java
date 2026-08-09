package com.ikea.server.web;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Optionally serves the repo's public assets (images/seo/fonts) when
 * ikea.static.public-dir points at the public folder. Disabled by default.
 */
@RestController
public class StaticFileController {

  private final Path baseDir;

  public StaticFileController(@Value("${ikea.static.public-dir:}") String publicDir) {
    this.baseDir =
        (publicDir == null || publicDir.isBlank())
            ? null
            : Path.of(publicDir).toAbsolutePath().normalize();
  }

  @GetMapping(value = {"/images/**", "/seo/**", "/fonts/**"})
  public ResponseEntity<Resource> serve(HttpServletRequest request) throws IOException {
    if (baseDir == null) {
      throw new ResourceNotFoundException("Static file serving is disabled");
    }
    String uri = request.getRequestURI();
    String relative = URLDecoder.decode(uri.startsWith("/") ? uri.substring(1) : uri, StandardCharsets.UTF_8);
    Path file = baseDir.resolve(relative).normalize();
    if (!file.startsWith(baseDir) || !Files.isRegularFile(file)) {
      throw new ResourceNotFoundException("Resource not found: " + uri);
    }
    Resource resource = new FileSystemResource(file);
    MediaType mediaType =
        MediaTypeFactory.getMediaType(resource).orElse(MediaType.APPLICATION_OCTET_STREAM);
    return ResponseEntity.ok().contentType(mediaType).body(resource);
  }
}
