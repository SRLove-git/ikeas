package com.ikea.server.integration.oms;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.ikea.server.data.DataStore;
import com.ikea.server.entity.OmsSkuMapping;
import com.ikea.server.mapper.OmsSkuMappingMapper;
import com.ikea.server.model.Product;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * BUZUD 商品与 OMS SKU 映射的统一管理服务（对接规范 §6.1）。
 *
 * <p>所有映射读写都经过这里，保证以下规范：
 * <ul>
 *   <li>productId 必须是 BUZUD 商品目录中真实存在的商品；</li>
 *   <li>omsSkuId 必须为正整数，且一个 OMS SKU 只能映射一个 BUZUD 商品；</li>
 *   <li>写入采用 upsert，重复导入不会产生重复数据；</li>
 *   <li>删除使用 MyBatis-Plus 逻辑删除，保留审计痕迹。</li>
 * </ul>
 */
@Service
public class OmsSkuMappingService {

  private static final Logger log = LoggerFactory.getLogger(OmsSkuMappingService.class);

  private final OmsSkuMappingMapper mappingMapper;
  private final DataStore dataStore;

  public OmsSkuMappingService(OmsSkuMappingMapper mappingMapper, DataStore dataStore) {
    this.mappingMapper = mappingMapper;
    this.dataStore = dataStore;
  }

  public List<OmsSkuMapping> list() {
    return mappingMapper.selectList(
        Wrappers.lambdaQuery(OmsSkuMapping.class)
            .orderByAsc(OmsSkuMapping::getProductId));
  }

  public OmsSkuMapping getByProductId(String productId) {
    return mappingMapper.selectOne(
        Wrappers.lambdaQuery(OmsSkuMapping.class)
            .eq(OmsSkuMapping::getProductId, productId));
  }

  /** 新增或更新一条映射；productId 存在则更新，否则新增。 */
  public OmsSkuMapping upsert(String productId, Long omsSkuId, String omsSkuNo) {
    String normalizedProductId = validateProductId(productId);
    Long normalizedSkuId = validateSkuId(omsSkuId);
    String normalizedSkuNo = normalize(omsSkuNo, 64);

    OmsSkuMapping existing = getByProductId(normalizedProductId);
    ensureSkuIdAvailable(normalizedSkuId, normalizedProductId);

    if (existing == null) {
      OmsSkuMapping mapping = new OmsSkuMapping();
      mapping.setProductId(normalizedProductId);
      mapping.setOmsSkuId(normalizedSkuId);
      mapping.setOmsSkuNo(normalizedSkuNo);
      mappingMapper.insert(mapping);
      return mapping;
    }

    existing.setOmsSkuId(normalizedSkuId);
    existing.setOmsSkuNo(normalizedSkuNo);
    mappingMapper.updateById(existing);
    return existing;
  }

  /** 逻辑删除映射；不存在时返回 false，调用方按 404 处理。 */
  public boolean deleteByProductId(String productId) {
    OmsSkuMapping existing = getByProductId(productId);
    if (existing == null) {
      return false;
    }
    mappingMapper.deleteById(existing.getId());
    return true;
  }

  /**
   * 校验商品映射并返回 productId → omsSkuId。任一商品未映射即拒绝下单
   * （对接规范 §6.1 / 验收 T04）：商城侧拦截，不向 OMS 发出请求。
   */
  public Map<String, Long> requireMappings(List<String> productIds) {
    List<OmsSkuMapping> mappings =
        mappingMapper.selectList(
            Wrappers.lambdaQuery(OmsSkuMapping.class)
                .in(OmsSkuMapping::getProductId, productIds));
    Map<String, Long> byProduct =
        mappings.stream()
            .collect(
                Collectors.toMap(
                    OmsSkuMapping::getProductId, OmsSkuMapping::getOmsSkuId));
    List<String> missing =
        productIds.stream().filter(id -> !byProduct.containsKey(id)).distinct().toList();
    if (!missing.isEmpty()) {
      log.error("订单包含未配置 OMS 映射的商品，拒绝下单 missing={}", missing);
      throw new IllegalArgumentException("商品未配置 OMS 映射: " + String.join(", ", missing));
    }
    return byProduct;
  }

  public Long requireSkuId(String productId) {
    OmsSkuMapping mapping = getByProductId(productId);
    if (mapping == null) {
      throw new IllegalStateException("商品未配置 OMS 映射: " + productId);
    }
    return mapping.getOmsSkuId();
  }

  private String validateProductId(String productId) {
    String normalized = normalize(productId, 64);
    if (normalized == null) {
      throw new IllegalArgumentException("productId 不能为空");
    }
    Product product = dataStore.findProductById(normalized);
    if (product == null) {
      throw new IllegalArgumentException("BUZUD 商品不存在: " + normalized);
    }
    return normalized;
  }

  private Long validateSkuId(Long omsSkuId) {
    if (omsSkuId == null || omsSkuId <= 0) {
      throw new IllegalArgumentException("omsSkuId 必须为正整数");
    }
    return omsSkuId;
  }

  private void ensureSkuIdAvailable(Long omsSkuId, String excludeProductId) {
    List<OmsSkuMapping> conflicts =
        mappingMapper.selectList(
            Wrappers.lambdaQuery(OmsSkuMapping.class)
                .eq(OmsSkuMapping::getOmsSkuId, omsSkuId)
                .ne(OmsSkuMapping::getProductId, excludeProductId));
    if (!conflicts.isEmpty()) {
      throw new IllegalArgumentException(
          "OMS SKU " + omsSkuId + " 已映射到 BUZUD 商品 "
              + conflicts.stream()
                  .map(OmsSkuMapping::getProductId)
                  .distinct()
                  .collect(Collectors.joining(", ")));
    }
  }

  private static String normalize(String value, int maxLength) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    if (trimmed.isEmpty()) {
      return null;
    }
    if (trimmed.length() > maxLength) {
      throw new IllegalArgumentException("字段长度不能超过 " + maxLength);
    }
    return trimmed;
  }
}
