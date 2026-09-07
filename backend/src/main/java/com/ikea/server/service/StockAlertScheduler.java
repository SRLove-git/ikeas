package com.ikea.server.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ikea.server.entity.OmsSkuMapping;
import com.ikea.server.entity.StockAlert;
import com.ikea.server.integration.oms.OmsChannel;
import com.ikea.server.integration.oms.OmsProductSyncService;
import com.ikea.server.integration.oms.OmsSkuMappingService;
import com.ikea.server.mapper.StockAlertMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * 缺货登记到货提醒：扫描待提醒记录，商品恢复可售后标记已通知并推送配置的 webhook。
 */
@Service
public class StockAlertScheduler {

  private static final Logger log = LoggerFactory.getLogger(StockAlertScheduler.class);
  private static final ObjectMapper MAPPER = new ObjectMapper();
  private final HttpClient httpClient = HttpClient.newBuilder()
      .connectTimeout(Duration.ofSeconds(5))
      .build();

  private final StockAlertMapper stockAlertMapper;
  private final OmsChannel omsChannel;
  private final OmsSkuMappingService skuMappingService;
  private final OmsProductSyncService productSyncService;

  @Value("${ikea.notification.stock-webhook-url:}")
  private String stockWebhookUrl;

  public StockAlertScheduler(
      StockAlertMapper stockAlertMapper,
      OmsChannel omsChannel,
      OmsSkuMappingService skuMappingService,
      OmsProductSyncService productSyncService) {
    this.stockAlertMapper = stockAlertMapper;
    this.omsChannel = omsChannel;
    this.skuMappingService = skuMappingService;
    this.productSyncService = productSyncService;
  }

  @Scheduled(initialDelayString = "15000", fixedDelayString = "60000")
  public void checkStockAlerts() {
    List<StockAlert> alerts = stockAlertMapper.selectList(
        Wrappers.lambdaQuery(StockAlert.class).eq(StockAlert::getStatus, 0));
    for (StockAlert alert : alerts) {
      try {
        if (!available(alert.getProductId())) {
          continue;
        }
        alert.setStatus(1);
        alert.setNotifiedAt(LocalDateTime.now());
        stockAlertMapper.updateById(alert);
        sendWebhook(alert);
      } catch (Exception ex) {
        log.warn("到货提醒处理失败 productId={} error={}", alert.getProductId(), ex.getMessage());
      }
    }
  }

  private boolean available(String productId) {
    if (!omsChannel.isEnabled()) {
      return true;
    }
    OmsSkuMapping mapping = skuMappingService.getByProductId(productId);
    if (mapping == null) {
      return false;
    }
    return productSyncService.availableStock(mapping.getOmsSkuId()) > 0;
  }

  private void sendWebhook(StockAlert alert) {
    if (stockWebhookUrl == null || stockWebhookUrl.isBlank()) {
      log.info(
          "商品已到货，提醒记录已更新 productId={} contact={}（未配置 webhook，仅记录）",
          alert.getProductId(), alert.getContact());
      return;
    }
    try {
      String body = MAPPER.writeValueAsString(java.util.Map.of(
          "productId", alert.getProductId(),
          "contact", alert.getContact(),
          "message", "您关注的商品已到货"));
      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create(stockWebhookUrl))
          .header("Content-Type", "application/json")
          .timeout(Duration.ofSeconds(5))
          .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
          .build();
      httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    } catch (Exception ex) {
      log.warn("到货提醒 webhook 推送失败 productId={}", alert.getProductId(), ex);
    }
  }
}
