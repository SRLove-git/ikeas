package com.ikea.server.web;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.ikea.server.entity.OmsOrderMapping;
import com.ikea.server.entity.OmsSkuMapping;
import com.ikea.server.integration.oms.OmsChannel;
import com.ikea.server.integration.oms.OmsOrderSyncService;
import com.ikea.server.integration.oms.OmsProperties;
import com.ikea.server.mapper.OmsOrderMappingMapper;
import com.ikea.server.mapper.OmsSkuMappingMapper;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 对接状态查询（对接规范 §4.4）：管理后台展示 OMS 对接模式与同步积压。 */
@RestController
@RequestMapping("/api/v1/integration")
public class IntegrationStatusController {

  private final OmsProperties properties;
  private final OmsChannel channel;
  private final OmsOrderMappingMapper orderMappingMapper;
  private final OmsSkuMappingMapper skuMappingMapper;

  public IntegrationStatusController(
      OmsProperties properties,
      OmsChannel channel,
      OmsOrderMappingMapper orderMappingMapper,
      OmsSkuMappingMapper skuMappingMapper) {
    this.properties = properties;
    this.channel = channel;
    this.orderMappingMapper = orderMappingMapper;
    this.skuMappingMapper = skuMappingMapper;
  }

  @GetMapping("/oms/status")
  public Map<String, Object> omsStatus() {
    boolean enabled = channel.isEnabled();
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("enabled", enabled);
    body.put("mode", enabled ? "connected" : "standalone");
    body.put("gatewayUrl", properties.getGatewayUrl());
    body.put("pendingCount", enabled ? pendingCount() : 0);
    body.put("failedCount", enabled ? failedCount() : 0);
    body.put("skuMappings", enabled ? skuMappings() : 0);
    return body;
  }

  private long pendingCount() {
    return orderMappingMapper.selectCount(
        Wrappers.lambdaQuery(OmsOrderMapping.class)
            .eq(OmsOrderMapping::getSyncStatus, OmsOrderSyncService.SYNC_PENDING));
  }

  private long failedCount() {
    return orderMappingMapper.selectCount(
        Wrappers.lambdaQuery(OmsOrderMapping.class)
            .eq(OmsOrderMapping::getSyncStatus, OmsOrderSyncService.SYNC_FAILED));
  }

  private long skuMappings() {
    return skuMappingMapper.selectCount(
        Wrappers.lambdaQuery(OmsSkuMapping.class));
  }
}
