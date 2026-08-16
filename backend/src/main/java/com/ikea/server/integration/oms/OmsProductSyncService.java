package com.ikea.server.integration.oms;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.ikea.server.entity.OmsSkuMapping;
import com.ikea.server.integration.oms.OmsChannel.OmsOrderInput.Line;
import com.ikea.server.integration.oms.OmsChannel.OmsProduct;
import com.ikea.server.integration.oms.OmsChannel.OmsProductPage;
import com.ikea.server.integration.oms.OmsChannel.OmsStock;
import com.ikea.server.mapper.OmsSkuMappingMapper;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * OMS 商品/库存只读同步（对接规范 §5.2 / §4.3-4 / §6.4）：
 *
 * <ul>
 *   <li>定时刷新 OMS 在售 SKU 的价格与可售库存快照到 {@code oms_sku_mapping}；</li>
 *   <li>下单前实时校验可售库存（以 OMS 为准）；</li>
 *   <li>OMS 读取失败时降级到上次快照；无快照时不盲目按零库存拦截。</li>
 * </ul>
 */
@Service
public class OmsProductSyncService {

  private static final Logger log = LoggerFactory.getLogger(OmsProductSyncService.class);

  private final OmsChannel channel;
  private final OmsProperties properties;
  private final OmsSkuMappingMapper skuMappingMapper;

  public OmsProductSyncService(
      OmsChannel channel, OmsProperties properties, OmsSkuMappingMapper skuMappingMapper) {
    this.channel = channel;
    this.properties = properties;
    this.skuMappingMapper = skuMappingMapper;
  }

  /** 定时刷新价格/库存快照（短 TTL）。OMS 失败时保留上次快照，不阻断主流程。 */
  @Scheduled(
      initialDelayString = "30000",
      fixedDelayString = "${ikea.oms.product-sync.interval-ms:60000}")
  public void refreshSnapshots() {
    if (!channel.isEnabled() || !properties.getProductSync().isEnabled()) {
      return;
    }

    List<OmsSkuMapping> mappings =
        skuMappingMapper.selectList(Wrappers.lambdaQuery(OmsSkuMapping.class));
    if (mappings.isEmpty()) {
      return;
    }

    Map<Long, OmsSkuMapping> bySkuId =
        mappings.stream()
            .filter(mapping -> mapping.getOmsSkuId() != null)
            .collect(
                Collectors.toMap(
                    OmsSkuMapping::getOmsSkuId, Function.identity(), (left, right) -> left));
    int pageSize = Math.max(1, properties.getProductSync().getPageSize());
    long seen = 0;
    int page = 1;

    try {
      while (true) {
        OmsProductPage result = channel.productsOnSale("", page, pageSize);
        if (result == null || result.items() == null || result.items().isEmpty()) {
          break;
        }
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        for (OmsProduct product : result.items()) {
          OmsSkuMapping mapping = bySkuId.get(product.skuId());
          if (mapping == null) {
            continue;
          }
          mapping.setSyncPrice(product.price());
          mapping.setSyncStock(product.availableStock());
          if (mapping.getOmsSkuNo() == null) {
            mapping.setOmsSkuNo(product.skuNo());
          }
          mapping.setLastSyncAt(now);
          skuMappingMapper.updateById(mapping);
        }
        seen += result.items().size();
        if (seen >= result.total() || result.items().size() < pageSize) {
          break;
        }
        page++;
      }
    } catch (OmsCallException ex) {
      log.warn("OMS 商品快照刷新失败，沿用上次快照 error={}", ex.getMessage());
    }
  }

  /**
   * 返回 OMS 实时可售库存；读取失败时降级到 {@code oms_sku_mapping.sync_stock} 快照。
   * 无快照时返回 -1（未知），由调用方按「禁止盲目拦截」处理。
   */
  public int availableStock(Long skuId) {
    if (!channel.isEnabled()) {
      return -1;
    }
    try {
      OmsStock stock = channel.availableStock(skuId);
      updateStockSnapshot(skuId, stock.availableStock());
      return stock.availableStock();
    } catch (OmsCallException ex) {
      OmsSkuMapping mapping = findBySkuId(skuId);
      return mapping == null || mapping.getSyncStock() == null ? -1 : mapping.getSyncStock();
    }
  }

  /**
   * 下单前库存校验（§4.2）：可售库存不足时拒绝下单；OMS 不可用且无快照时放行并告警
   * （§4.3-4，禁止在 OMS 故障时盲目按零库存拦截）。
   */
  public void ensureStockAvailable(List<Line> lines) {
    if (!channel.isEnabled()) {
      return;
    }
    for (Line line : lines) {
      int stock = availableStock(line.skuId());
      if (stock >= 0 && stock < line.quantity()) {
        throw new IllegalArgumentException(
            "库存不足：SKU "
                + line.skuId()
                + " 可售 "
                + stock
                + "，需求 "
                + line.quantity());
      }
      if (stock < 0) {
        log.warn(
            "OMS 库存不可用，按降级策略放行下单 skuId={} quantity={}",
            line.skuId(),
            line.quantity());
      }
    }
  }

  private OmsSkuMapping findBySkuId(Long skuId) {
    return skuMappingMapper.selectOne(
        Wrappers.lambdaQuery(OmsSkuMapping.class).eq(OmsSkuMapping::getOmsSkuId, skuId));
  }

  private void updateStockSnapshot(Long skuId, int stock) {
    OmsSkuMapping mapping = findBySkuId(skuId);
    if (mapping == null) {
      return;
    }
    mapping.setSyncStock(stock);
    mapping.setLastSyncAt(LocalDateTime.now(ZoneOffset.UTC));
    skuMappingMapper.updateById(mapping);
  }
}
