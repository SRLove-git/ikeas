package com.ikea.server.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/** Aliyun OSS configuration, injected from ikea.oss.* properties. */
@Component
@ConfigurationProperties(prefix = "ikea.oss")
public class OssStorageProperties {

  private boolean enabled;
  private String endpoint;
  private String bucket;
  private String accessKeyId;
  private String accessKeySecret;
  private String publicUrlBase;
  private long maxSizeBytes = 20 * 1024 * 1024;

  public boolean isEnabled() {
    return enabled;
  }

  public void setEnabled(boolean enabled) {
    this.enabled = enabled;
  }

  public String getEndpoint() {
    return endpoint;
  }

  public void setEndpoint(String endpoint) {
    this.endpoint = endpoint;
  }

  public String getBucket() {
    return bucket;
  }

  public void setBucket(String bucket) {
    this.bucket = bucket;
  }

  public String getAccessKeyId() {
    return accessKeyId;
  }

  public void setAccessKeyId(String accessKeyId) {
    this.accessKeyId = accessKeyId;
  }

  public String getAccessKeySecret() {
    return accessKeySecret;
  }

  public void setAccessKeySecret(String accessKeySecret) {
    this.accessKeySecret = accessKeySecret;
  }

  public String getPublicUrlBase() {
    return publicUrlBase;
  }

  public void setPublicUrlBase(String publicUrlBase) {
    this.publicUrlBase = publicUrlBase;
  }

  public long getMaxSizeBytes() {
    return maxSizeBytes;
  }

  public void setMaxSizeBytes(long maxSizeBytes) {
    this.maxSizeBytes = maxSizeBytes;
  }
}
