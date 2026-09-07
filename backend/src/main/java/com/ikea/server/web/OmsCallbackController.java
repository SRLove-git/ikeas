package com.ikea.server.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ikea.server.dto.oms.OmsCallbackRequest;
import com.ikea.server.integration.oms.OmsCallbackService;
import com.ikea.server.integration.oms.OmsSigner;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/callback/oms")
public class OmsCallbackController {

  private final OmsCallbackService callbackService;
  private final ObjectMapper objectMapper;

  @Value("${ikea.oms.callback-secret:demo-mall-callback-secret-change-me}")
  private String callbackSecret;

  public OmsCallbackController(OmsCallbackService callbackService, ObjectMapper objectMapper) {
    this.callbackService = callbackService;
    this.objectMapper = objectMapper;
  }

  @PostMapping
  public Map<String, Boolean> receive(
      @RequestBody String payload,
      @RequestHeader(value = "X-Oms-Signature", required = false) String signature) {
    if (signature == null || signature.isBlank()) {
      throw new UnauthorizedException("缺少回调签名");
    }
    String expected = OmsSigner.hmacSha256Hex(callbackSecret, payload);
    if (!java.security.MessageDigest.isEqual(
        expected.getBytes(java.nio.charset.StandardCharsets.UTF_8),
        signature.getBytes(java.nio.charset.StandardCharsets.UTF_8))) {
      throw new UnauthorizedException("回调签名校验失败");
    }
    try {
      OmsCallbackRequest request = objectMapper.readValue(payload, OmsCallbackRequest.class);
      callbackService.handle(request);
    } catch (UnauthorizedException ex) {
      throw ex;
    } catch (Exception ex) {
      throw new IllegalArgumentException("回调报文解析失败", ex);
    }
    return Map.of("ok", true);
  }
}
