package com.ikea.server.storage;

import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import com.aliyun.oss.model.ObjectMetadata;
import jakarta.annotation.PreDestroy;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/** Simple Aliyun OSS storage facade for admin file uploads. */
@Service
public class OssStorageService {

  private final OssStorageProperties properties;
  private final OSS client;

  public OssStorageService(OssStorageProperties properties) {
    this.properties = properties;
    this.client =
        properties.isEnabled()
            ? new OSSClientBuilder()
                .build(
                    properties.getEndpoint(),
                    properties.getAccessKeyId(),
                    properties.getAccessKeySecret())
            : null;
  }

  public Map<String, Object> upload(MultipartFile file, String objectKey) {
    ensureEnabled();
    if (file == null || file.isEmpty()) {
      throw new IllegalArgumentException("上传文件不能为空");
    }
    if (file.getSize() > properties.getMaxSizeBytes()) {
      throw new IllegalArgumentException(
          "文件不能超过 " + properties.getMaxSizeBytes() / 1024 / 1024 + "MB");
    }

    String key = normalizeObjectKey(objectKey);
    if (key == null || key.isBlank()) {
      key = generateObjectKey(file.getOriginalFilename());
    }

    ObjectMetadata metadata = new ObjectMetadata();
    metadata.setContentLength(file.getSize());
    metadata.setContentType(file.getContentType());

    try (InputStream input = file.getInputStream()) {
      client.putObject(properties.getBucket(), key, input, metadata);
    } catch (IOException ex) {
      throw new IllegalStateException("读取上传文件失败", ex);
    }

    return Map.of(
        "objectKey", key,
        "url", publicUrl(key),
        "size", file.getSize(),
        "contentType", metadata.getContentType());
  }

  public Map<String, Object> delete(String objectKey) {
    ensureEnabled();
    String key = normalizeObjectKey(objectKey);
    if (key == null || key.isBlank()) {
      throw new IllegalArgumentException("objectKey 不能为空");
    }
    client.deleteObject(properties.getBucket(), key);
    return Map.of("ok", true, "objectKey", key);
  }

  public Map<String, Object> status() {
    return Map.of(
        "enabled", properties.isEnabled(),
        "bucket", properties.getBucket(),
        "endpoint", properties.getEndpoint(),
        "publicUrlBase", properties.getPublicUrlBase());
  }

  private void ensureEnabled() {
    if (!properties.isEnabled()) {
      throw new IllegalStateException("OSS 存储未启用，请先配置 IKEA_OSS_* 环境变量");
    }
  }

  private String generateObjectKey(String originalFilename) {
    String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
    String extension = extension(originalFilename);
    return "uploads/" + date + "/" + UUID.randomUUID() + extension;
  }

  private String extension(String filename) {
    if (filename == null) {
      return "";
    }
    int dot = filename.lastIndexOf('.');
    if (dot < 0 || dot == filename.length() - 1) {
      return "";
    }
    String ext = filename.substring(dot).toLowerCase();
    return ext.matches("\\.[a-z0-9]{1,8}") ? ext : "";
  }

  private String normalizeObjectKey(String key) {
    if (key == null) {
      return null;
    }
    String normalized =
        key.trim().replace('\\', '/').replaceAll("/{2,}", "/").replaceFirst("^/+", "");
    if (normalized.contains("..")) {
      throw new IllegalArgumentException("objectKey 不能包含 ..");
    }
    return normalized;
  }

  private String publicUrl(String objectKey) {
    String base = properties.getPublicUrlBase();
    if (base != null && !base.isBlank()) {
      return base.replaceFirst("/+$", "") + "/" + objectKey;
    }
    String host = host(properties.getEndpoint());
    return "https://" + properties.getBucket() + "." + host + "/" + objectKey;
  }

  private String host(String endpoint) {
    try {
      String value = URI.create(endpoint).getHost();
      return value == null ? endpoint : value;
    } catch (IllegalArgumentException ex) {
      return endpoint;
    }
  }

  @PreDestroy
  public void close() {
    if (client != null) {
      client.shutdown();
    }
  }
}
