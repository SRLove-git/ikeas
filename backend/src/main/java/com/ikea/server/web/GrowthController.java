package com.ikea.server.web;

import com.ikea.server.constant.SecurityConstants;
import com.ikea.server.dto.growth.GrowthDtos.ActivityProduct;
import com.ikea.server.dto.growth.GrowthDtos.EventRequest;
import com.ikea.server.dto.growth.GrowthDtos.EventSummary;
import com.ikea.server.dto.growth.GrowthDtos.HotSearch;
import com.ikea.server.dto.growth.GrowthDtos.PromotionView;
import com.ikea.server.model.Product;
import com.ikea.server.service.GrowthService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/growth")
public class GrowthController {

  private final GrowthService growthService;

  public GrowthController(GrowthService growthService) {
    this.growthService = growthService;
  }

  @GetMapping("/activities")
  public List<ActivityProduct> activities() {
    return growthService.activities();
  }

  @GetMapping("/hot-searches")
  public List<HotSearch> hotSearches() {
    return growthService.hotSearches();
  }

  @GetMapping("/recommendations")
  public List<Product> recommendations(
      @RequestParam(required = false) String productId,
      @RequestParam(defaultValue = "8") int limit) {
    return growthService.recommendations(productId, limit);
  }

  @GetMapping("/promotions")
  public List<PromotionView> promotions() {
    return growthService.promotions();
  }

  @PostMapping("/events")
  public void recordEvent(@RequestBody EventRequest request, HttpServletRequest servletRequest) {
    Long userId = null;
    String value = (String) servletRequest.getAttribute(SecurityConstants.USER_ID_ATTRIBUTE);
    if (value != null) {
      userId = Long.valueOf(value);
    }
    growthService.recordEvent(userId, request);
  }

  @GetMapping("/analytics/summary")
  public EventSummary summary() {
    return growthService.summary();
  }
}
