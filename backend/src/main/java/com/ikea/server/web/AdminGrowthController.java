package com.ikea.server.web;

import com.ikea.server.dto.growth.GrowthDtos.PromotionRequest;
import com.ikea.server.dto.growth.GrowthDtos.PromotionView;
import com.ikea.server.service.GrowthService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/growth")
public class AdminGrowthController {

  private final GrowthService growthService;

  public AdminGrowthController(GrowthService growthService) {
    this.growthService = growthService;
  }

  @GetMapping("/promotions")
  public List<PromotionView> promotions() {
    return growthService.promotions();
  }

  @PostMapping("/promotions")
  public PromotionView create(@RequestBody PromotionRequest request) {
    return growthService.createPromotion(request);
  }
}
