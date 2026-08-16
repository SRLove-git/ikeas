package com.ikea.server.integration.oms;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ikea.server.integration.oms.OmsDtos.OmsResult;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * OMS Open API HTTP 客户端：签名、发送、解析 {@code {code,message,data}} 包装。
 *
 * <p>不负责业务重试（重试与退避由 {@link OmsOrderSyncService} 控制），
 * 只保证单次请求的正确性：签名失败/网络错误/错误码统一抛 {@link OmsCallException}。
 */
public class OmsHttpClient {

  private static final Logger log = LoggerFactory.getLogger(OmsHttpClient.class);

  private final OmsProperties properties;
  private final ObjectMapper mapper;
  private final HttpClient http;

  public OmsHttpClient(OmsProperties properties, ObjectMapper mapper) {
    this.properties = properties;
    this.mapper = mapper.copy().configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    this.http =
        HttpClient.newBuilder()
            .connectTimeout(Duration.ofMillis(properties.getConnectTimeoutMs()))
            .build();
  }

  public <T> OmsResult<T> post(String path, Object body, Class<T> dataType) {
    return send("POST", path, body, dataType);
  }

  public <T> OmsResult<T> get(String path, Class<T> dataType) {
    return send("GET", path, null, dataType);
  }

  private <T> OmsResult<T> send(String method, String path, Object body, Class<T> dataType) {
    String json = body == null ? "" : toJson(body);
    // OMS 网关签名只使用路径（不含 query），见 OpenApiAuthFilter 的 getRawPath()。
    int queryIndex = path.indexOf('?');
    String signPath = queryIndex >= 0 ? path.substring(0, queryIndex) : path;
    String timestamp = OmsSigner.timestamp();
    String nonce = OmsSigner.nonce();
    String sign =
        OmsSigner.sign(
            properties.getAppSecret(), method, signPath, timestamp, nonce, OmsSigner.sha256Hex(json));

    HttpRequest.Builder builder =
        HttpRequest.newBuilder()
            .uri(URI.create(properties.getGatewayUrl() + path))
            .timeout(Duration.ofMillis(properties.getReadTimeoutMs()))
            .header("Content-Type", "application/json")
            .header("Accept", "application/json")
            .header("X-App-Id", properties.getAppId())
            .header("X-Timestamp", timestamp)
            .header("X-Nonce", nonce)
            .header("X-Sign", sign);
    if ("GET".equals(method)) {
      builder.GET();
    } else {
      builder.method(method, HttpRequest.BodyPublishers.ofString(json));
    }

    long started = System.currentTimeMillis();
    HttpResponse<String> response;
    try {
      response = http.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    } catch (IOException ex) {
      log.warn("OMS 调用网络异常 method={} path={} elapsedMs={}", method, path, elapsed(started), ex);
      throw new OmsCallException(0, "OMS 网关不可达: " + ex.getMessage(), ex);
    } catch (InterruptedException ex) {
      Thread.currentThread().interrupt();
      throw new OmsCallException(0, "OMS 调用被中断", ex);
    }

    String responseBody = response.body() == null ? "" : response.body();
    log.debug(
        "OMS 调用完成 method={} path={} httpStatus={} elapsedMs={}",
        method, path, response.statusCode(), elapsed(started));

    OmsResult<T> result = parse(responseBody, dataType);
    if (response.statusCode() >= 400 || !result.success()) {
      throw new OmsCallException(
          result.code() == 0 ? response.statusCode() : result.code(),
          "OMS 调用失败 method=" + method + " path=" + path + " code=" + result.code()
              + " message=" + result.message());
    }
    return result;
  }

  private <T> OmsResult<T> parse(String json, Class<T> dataType) {
    try {
      JavaType type = mapper.getTypeFactory().constructParametricType(OmsResult.class, dataType);
      return mapper.readValue(json, type);
    } catch (IOException ex) {
      throw new OmsCallException(0, "OMS 响应解析失败: " + ex.getMessage(), ex);
    }
  }

  private String toJson(Object body) {
    try {
      return mapper.writeValueAsString(body);
    } catch (IOException ex) {
      throw new OmsCallException(0, "OMS 请求序列化失败: " + ex.getMessage(), ex);
    }
  }

  private static long elapsed(long started) {
    return System.currentTimeMillis() - started;
  }
}
