package com.ikea.server.web;

import com.ikea.server.dto.shipping.ShippingDtos.ShippingQuote;
import com.ikea.server.service.ShippingService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/shipping")
public class ShippingController {

  private final ShippingService shippingService;

  public ShippingController(ShippingService shippingService) {
    this.shippingService = shippingService;
  }

  @GetMapping("/quote")
  public ShippingQuote quote() {
    return shippingService.quote();
  }
}
