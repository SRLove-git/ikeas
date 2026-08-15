package com.ikea.server.web;

import com.ikea.server.dto.order.AdminOrderRow;
import com.ikea.server.dto.order.AdminOrderUpdateRequest;
import com.ikea.server.entity.AppUser;
import com.ikea.server.service.OrderService;
import com.ikea.server.service.UserService;
import jakarta.validation.Valid;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 管理后台订单查询、修改和软删除（受 X-Admin-Key 拦截器保护）。 */
@RestController
@RequestMapping("/api/v1/admin/orders")
public class AdminOrderController {

  private final OrderService orderService;
  private final UserService userService;

  public AdminOrderController(OrderService orderService, UserService userService) {
    this.orderService = orderService;
    this.userService = userService;
  }

  @GetMapping
  public Map<String, Object> list() {
    List<Map<String, Object>> items = orderService.listAdmin().stream().map(this::toMap).toList();
    return Map.of("items", items, "total", items.size());
  }

  @GetMapping("/{orderNo}")
  public Map<String, Object> get(@PathVariable String orderNo) {
    return toMap(orderService.getAdmin(orderNo));
  }

  @PutMapping("/{orderNo}")
  public Map<String, Object> update(
      @PathVariable String orderNo, @Valid @RequestBody AdminOrderUpdateRequest request) {
    return toMap(orderService.updateAdmin(orderNo, request));
  }

  @DeleteMapping("/{orderNo}")
  public Map<String, Object> delete(@PathVariable String orderNo) {
    boolean removed = orderService.softDeleteAdmin(orderNo);
    if (!removed) {
      return Map.of("ok", false);
    }
    return Map.of("ok", true);
  }

  private Map<String, Object> toMap(AdminOrderRow row) {
    AppUser user = userService.findById(row.userId()).orElse(null);
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("id", row.id());
    result.put("orderNo", row.orderNo());
    result.put("userId", row.userId());
    result.put("userName", user == null ? null : user.getName());
    result.put("userPhone", user == null ? null : user.getPhone());
    result.put("status", row.status());
    result.put("statusLabel", row.statusLabel());
    result.put("currency", row.currency());
    result.put("subtotal", row.subtotal());
    result.put("deliveryFee", row.deliveryFee());
    result.put("totalAmount", row.totalAmount());
    result.put("customer", row.customer());
    result.put("phone", row.phone());
    result.put("address", row.address());
    result.put("remark", row.remark());
    result.put("items", row.items());
    result.put("createdAt", row.createdAt());
    result.put("updatedAt", row.updatedAt());
    return result;
  }
}
