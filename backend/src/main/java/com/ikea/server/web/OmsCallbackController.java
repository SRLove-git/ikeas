package com.ikea.server.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.ikea.server.dto.oms.OmsCallbackRequest;
import com.ikea.server.entity.OmsCallbackEvent;
import com.ikea.server.integration.oms.OmsCallbackService;
import com.ikea.server.integration.oms.OmsSigner;
import com.ikea.server.mapper.OmsCallbackEventMapper;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 接收 OMS 回调：验签（时间戳 + nonce 防重放 + HMAC）并按 eventId 幂等去重。 */
@RestController
@RequestMapping("/api/v1/callback/oms")
public class OmsCallbackController {

  private static final Logger log = LoggerFactory.getLogger(OmsCallbackController.class);
  private static final String CALLBACK_PATH = "/api/v1/callback/oms";
  private static final int MAX_NONCE_CACHE = 10_000;

  private final OmsCallbackService callbackService;
  private final ObjectMapper objectMapper;
  private final OmsCallbackEventMapper eventMapper;
  private final Map<String, Long> nonceCache = new ConcurrentHashMap<>();

  @Value("${ikea.oms.callback-secret:demo-mall-callback-secret-change-me}")
  private String callbackSecret;

  @Value("${ikea.oms.callback-timestamp-window-seconds:300}")
  private long timestampWindowSeconds;

  public OmsCallbackController(
      OmsCallbackService callbackService,
      ObjectMapper objectMapper,
      OmsCallbackEventMapper eventMapper) {
    this.callbackService = callbackService;
    this.objectMapper = objectMapper;
    this.eventMapper = eventMapper;
  }

  @PostMapping
  public Map<String, Object> receive(
      @RequestBody String payload,
      @RequestHeader(value = "X-App-Id", required = false) String appId,
      @RequestHeader(value = "X-Timestamp", required = false) String timestamp,
      @RequestHeader(value = "X-Nonce", required = false) String nonce,
      @RequestHeader(value = "X-Sign", required = false) String sign) {
    requireHeaders(appId, timestamp, nonce, sign);
    validateTimestamp(timestamp);
    validateNonce(appId, nonce);
    verifySignature(payload, timestamp, nonce, sign);

    OmsCallbackRequest request = parse(payload);
    if (isBlank(request.eventId())) {
      throw new IllegalArgumentException("回调缺少 eventId");
    }
    if (alreadyReceived(request.eventId())) {
      return success();
    }
    callbackService.handle(request);
    markReceived(request.eventId(), request.event());
    return success();
  }

  private void requireHeaders(String appId, String timestamp, String nonce, String sign) {
    if (isBlank(appId) || isBlank(timestamp) || isBlank(nonce) || isBlank(sign)) {
      throw new UnauthorizedException("缺少回调签名头");
    }
  }

  private void validateTimestamp(String timestamp) {
    long ts;
    try {
      ts = Long.parseLong(timestamp);
    } catch (NumberFormatException ex) {
      throw new UnauthorizedException("回调时间戳非法");
    }
    long now = System.currentTimeMillis() / 1000;
    if (Math.abs(now - ts) > timestampWindowSeconds) {
      throw new UnauthorizedException("回调时间戳已过期");
    }
  }

  private void validateNonce(String appId, String nonce) {
    long now = System.currentTimeMillis() / 1000;
    if (nonceCache.size() > MAX_NONCE_CACHE) {
      nonceCache.entrySet().removeIf(entry -> entry.getValue() < now);
    }
    String key = appId + ":" + nonce;
    Long previous = nonceCache.putIfAbsent(key, now + timestampWindowSeconds * 2);
    if (previous != null) {
      throw new UnauthorizedException("回调 nonce 重复");
    }
  }

  private void verifySignature(String payload, String timestamp, String nonce, String sign) {
    String expected =
        OmsSigner.sign(
            callbackSecret,
            "POST",
            CALLBACK_PATH,
            timestamp,
            nonce,
            OmsSigner.sha256Hex(payload));
    if (!MessageDigest.isEqual(
        expected.getBytes(StandardCharsets.UTF_8),
        sign.getBytes(StandardCharsets.UTF_8))) {
      throw new UnauthorizedException("回调签名校验失败");
    }
  }

  private OmsCallbackRequest parse(String payload) {
    try {
      return objectMapper.readValue(payload, OmsCallbackRequest.class);
    } catch (Exception ex) {
      throw new IllegalArgumentException("回调报文解析失败", ex);
    }
  }

  private boolean alreadyReceived(String eventId) {
    Long count =
        eventMapper.selectCount(
            Wrappers.lambdaQuery(OmsCallbackEvent.class)
                .eq(OmsCallbackEvent::getEventId, eventId));
    return count != null && count > 0;
  }

  private void markReceived(String eventId, String eventType) {
    OmsCallbackEvent event = new OmsCallbackEvent();
    event.setEventId(eventId);
    event.setEventType(eventType);
    event.setDeleted(0);
    event.setVersion(0);
    try {
      eventMapper.insert(event);
    } catch (DuplicateKeyException ex) {
      log.warn("回调事件并发去重命中 eventId={} event={}", eventId, eventType);
    }
  }

  private static Map<String, Object> success() {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("code", 0);
    body.put("message", "成功");
    return body;
  }

  private static boolean isBlank(String value) {
    return value == null || value.isBlank();
  }
}
