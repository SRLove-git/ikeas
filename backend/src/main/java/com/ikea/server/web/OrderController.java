package com.ikea.server.web;

import com.ikea.server.constant.SecurityConstants;
import com.ikea.server.dto.order.CreateOrderRequest;
import com.ikea.server.dto.order.OrderResponse;
import com.ikea.server.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

  private final OrderService orderService;

  public OrderController(OrderService orderService) {
    this.orderService = orderService;
  }

  @PostMapping
  public OrderResponse create(
      HttpServletRequest request, @Valid @RequestBody CreateOrderRequest body) {
    // 游客结账：未登录时允许匿名下单（user_id 为空），订单信息以提交的联系方式为准
    return orderService.create(optionalUserId(request), body);
  }

  @GetMapping
  public List<OrderResponse> list(HttpServletRequest request) {
    return orderService.list(userId(request));
  }

  @GetMapping("/{orderNo}")
  public OrderResponse get(HttpServletRequest request, @PathVariable String orderNo) {
    return orderService.get(userId(request), orderNo);
  }

  @PostMapping("/{orderNo}/cancel")
  public OrderResponse cancel(HttpServletRequest request, @PathVariable String orderNo) {
    return orderService.cancel(userId(request), orderNo);
  }

  @PostMapping("/{orderNo}/pay")
  public OrderResponse pay(HttpServletRequest request, @PathVariable String orderNo) {
    return orderService.pay(userId(request), orderNo);
  }

  @PostMapping("/{orderNo}/refund")
  public OrderResponse refund(HttpServletRequest request, @PathVariable String orderNo) {
    return orderService.refund(userId(request), orderNo);
  }

  private static Long userId(HttpServletRequest request) {
    Long userId = optionalUserId(request);
    if (userId == null) {
      throw new UnauthorizedException("请先登录");
    }
    return userId;
  }

  private static Long optionalUserId(HttpServletRequest request) {
    String value = (String) request.getAttribute(SecurityConstants.USER_ID_ATTRIBUTE);
    try {
      return value == null ? null : Long.valueOf(value);
    } catch (NumberFormatException ex) {
      return null;
    }
  }
}
