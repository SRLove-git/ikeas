package com.ikea.server.web;

import com.ikea.server.dto.oms.OmsCallbackRequest;
import com.ikea.server.integration.oms.OmsCallbackService;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/callback/oms")
public class OmsCallbackController {

  private final OmsCallbackService callbackService;

  public OmsCallbackController(OmsCallbackService callbackService) {
    this.callbackService = callbackService;
  }

  @PostMapping
  public Map<String, Boolean> receive(@RequestBody OmsCallbackRequest request) {
    callbackService.handle(request);
    return Map.of("ok", true);
  }
}
