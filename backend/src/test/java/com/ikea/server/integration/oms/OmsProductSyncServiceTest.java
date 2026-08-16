package com.ikea.server.integration.oms;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.ikea.server.entity.OmsSkuMapping;
import com.ikea.server.integration.oms.OmsChannel.OmsOrderInput.Line;
import com.ikea.server.integration.oms.OmsChannel.OmsProduct;
import com.ikea.server.integration.oms.OmsChannel.OmsProductPage;
import com.ikea.server.integration.oms.OmsChannel.OmsStock;
import com.ikea.server.mapper.OmsSkuMappingMapper;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

/** OMS 商品/库存只读同步测试：快照刷新、实时库存与降级策略（对接规范 §4.2 / §4.3-4）。 */
class OmsProductSyncServiceTest {

  private OmsChannel channel;
  private OmsProperties properties;
  private OmsSkuMappingMapper skuMappingMapper;
  private OmsProductSyncService service;

  @BeforeEach
  void setUp() {
    channel = org.mockito.Mockito.mock(OmsChannel.class);
    properties = new OmsProperties();
    properties.setEnabled(true);
    skuMappingMapper = org.mockito.Mockito.mock(OmsSkuMappingMapper.class);
    service = new OmsProductSyncService(channel, properties, skuMappingMapper);
    when(channel.isEnabled()).thenReturn(true);
  }

  @Test
  void availableStockShouldFallbackToSnapshotWhenOmsFails() {
    when(channel.availableStock(1001L)).thenThrow(new OmsCallException(0, "OMS 网关不可达"));
    when(skuMappingMapper.selectOne(any(Wrapper.class))).thenReturn(mapping(1001L, 5, null));

    int stock = service.availableStock(1001L);

    assertEquals(5, stock);
  }

  @Test
  void availableStockShouldReturnUnknownWhenOmsFailsWithoutSnapshot() {
    when(channel.availableStock(1001L)).thenThrow(new OmsCallException(0, "OMS 网关不可达"));
    when(skuMappingMapper.selectOne(any(Wrapper.class))).thenReturn(null);

    assertEquals(-1, service.availableStock(1001L));
  }

  @Test
  void ensureStockAvailableShouldRejectInsufficientStock() {
    when(channel.availableStock(1001L)).thenReturn(new OmsStock(1001L, "SKU001", 2));
    when(skuMappingMapper.selectOne(any(Wrapper.class))).thenReturn(mapping(1001L, 2, null));

    IllegalArgumentException ex =
        assertThrows(
            IllegalArgumentException.class,
            () -> service.ensureStockAvailable(List.of(new Line(1001L, 3))));

    org.assertj.core.api.Assertions.assertThat(ex.getMessage()).contains("库存不足");
    verify(skuMappingMapper).updateById(any(OmsSkuMapping.class));
  }

  @Test
  void ensureStockAvailableShouldAllowUnknownStockOnOmsFailure() {
    when(channel.availableStock(1001L)).thenThrow(new OmsCallException(0, "OMS 网关不可达"));
    when(skuMappingMapper.selectOne(any(Wrapper.class))).thenReturn(null);

    service.ensureStockAvailable(List.of(new Line(1001L, 10)));

    verify(skuMappingMapper, never()).updateById(any(OmsSkuMapping.class));
  }

  @Test
  void refreshSnapshotsShouldUpdatePriceAndStock() {
    OmsSkuMapping mapping = mapping(1001L, 0, null);
    when(skuMappingMapper.selectList(any(Wrapper.class))).thenReturn(List.of(mapping));
    when(channel.productsOnSale("", 1, 100))
        .thenReturn(
            new OmsProductPage(
                List.of(new OmsProduct(1001L, "SKU001", "商品 1001", new BigDecimal("12.50"), 7)),
                1));

    service.refreshSnapshots();

    ArgumentCaptor<OmsSkuMapping> captor = ArgumentCaptor.forClass(OmsSkuMapping.class);
    verify(skuMappingMapper).updateById(captor.capture());
    assertEquals(new BigDecimal("12.50"), captor.getValue().getSyncPrice());
    assertEquals(7, captor.getValue().getSyncStock());
    assertEquals("SKU001", captor.getValue().getOmsSkuNo());
  }

  @Test
  void refreshSnapshotsShouldKeepSnapshotWhenOmsFails() {
    when(skuMappingMapper.selectList(any(Wrapper.class)))
        .thenReturn(List.of(mapping(1001L, 9, new BigDecimal("9.90"))));
    when(channel.productsOnSale("", 1, 100)).thenThrow(new OmsCallException(0, "OMS 网关不可达"));

    service.refreshSnapshots();

    verify(skuMappingMapper, never()).updateById(any(OmsSkuMapping.class));
  }

  private static OmsSkuMapping mapping(Long omsSkuId, Integer syncStock, BigDecimal syncPrice) {
    OmsSkuMapping mapping = new OmsSkuMapping();
    mapping.setId(1L);
    mapping.setProductId("P1");
    mapping.setOmsSkuId(omsSkuId);
    mapping.setSyncStock(syncStock);
    mapping.setSyncPrice(syncPrice);
    return mapping;
  }
}
