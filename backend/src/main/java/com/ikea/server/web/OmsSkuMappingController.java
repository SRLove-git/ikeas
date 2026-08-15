package com.ikea.server.web;

import com.ikea.server.dto.oms.OmsSkuMappingUpsertRequest;
import com.ikea.server.entity.OmsSkuMapping;
import com.ikea.server.integration.oms.OmsSkuMappingService;
import jakarta.validation.Valid;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * OMS SKU 映射管理接口（受 /api/v1/admin/** 的 X-Admin-Key 保护）。
 *
 * <p>提供列表、幂等新增/更新、逻辑删除，供后台或导入脚本维护
 * BUZUD productId ↔ OMS skuId 映射。
 */
@RestController
@RequestMapping("/api/v1/admin/oms/sku-mappings")
public class OmsSkuMappingController {

  private final OmsSkuMappingService mappingService;

  public OmsSkuMappingController(OmsSkuMappingService mappingService) {
    this.mappingService = mappingService;
  }

  @GetMapping
  public Map<String, Object> list() {
    List<Map<String, Object>> items =
        mappingService.list().stream().map(OmsSkuMappingController::toMap).toList();
    return Map.of("items", items, "total", items.size());
  }

  @PostMapping
  public Map<String, Object> upsert(
      @Valid @RequestBody OmsSkuMappingUpsertRequest request) {
    OmsSkuMapping mapping =
        mappingService.upsert(request.productId(), request.omsSkuId(), request.omsSkuNo());
    return toMap(mapping);
  }

  @DeleteMapping("/{productId}")
  public ResponseEntity<Map<String, Object>> delete(
      @PathVariable String productId) {
    if (!mappingService.deleteByProductId(productId)) {
      return ResponseEntity.status(404)
          .body(Map.of("error", "映射不存在", "productId", productId));
    }
    return ResponseEntity.ok(Map.of("ok", true, "productId", productId));
  }

  private static Map<String, Object> toMap(OmsSkuMapping mapping) {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("id", mapping.getId());
    body.put("productId", mapping.getProductId());
    body.put("omsSkuId", mapping.getOmsSkuId());
    body.put("omsSkuNo", mapping.getOmsSkuNo());
    body.put("syncPrice", mapping.getSyncPrice());
    body.put("syncStock", mapping.getSyncStock());
    body.put("lastSyncAt", mapping.getLastSyncAt());
    body.put("createdAt", mapping.getCreatedAt());
    body.put("updatedAt", mapping.getUpdatedAt());
    return body;
  }
}
