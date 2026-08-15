package com.ikea.server.integration.oms;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.ikea.server.data.DataStore;
import com.ikea.server.entity.OmsSkuMapping;
import com.ikea.server.mapper.OmsSkuMappingMapper;
import com.ikea.server.model.Product;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

/** OMS SKU 映射服务测试：校验商品存在、SKU 唯一、幂等 upsert 与逻辑删除。 */
class OmsSkuMappingServiceTest {

  private OmsSkuMappingMapper mappingMapper;
  private DataStore dataStore;
  private OmsSkuMappingService service;

  @BeforeEach
  void setUp() {
    mappingMapper = org.mockito.Mockito.mock(OmsSkuMappingMapper.class);
    dataStore = org.mockito.Mockito.mock(DataStore.class);
    service = new OmsSkuMappingService(mappingMapper, dataStore);
    when(dataStore.findProductById("P1")).thenReturn(product("P1"));
    when(dataStore.findProductById("P2")).thenReturn(product("P2"));
  }

  @Test
  void upsertShouldInsertWhenMappingDoesNotExist() {
    when(mappingMapper.selectOne(any(Wrapper.class))).thenReturn(null);
    when(mappingMapper.selectList(any(Wrapper.class))).thenReturn(List.of());

    OmsSkuMapping result = service.upsert("P1", 1001L, "SKU001");

    ArgumentCaptor<OmsSkuMapping> captor = ArgumentCaptor.forClass(OmsSkuMapping.class);
    verify(mappingMapper).insert(captor.capture());
    assertEquals("P1", captor.getValue().getProductId());
    assertEquals(1001L, captor.getValue().getOmsSkuId());
    assertEquals("SKU001", captor.getValue().getOmsSkuNo());
    assertEquals("P1", result.getProductId());
  }

  @Test
  void upsertShouldUpdateExistingMapping() {
    OmsSkuMapping existing = mapping("P1", 1001L, "SKU001");
    when(mappingMapper.selectOne(any(Wrapper.class))).thenReturn(existing);
    when(mappingMapper.selectList(any(Wrapper.class))).thenReturn(List.of());

    OmsSkuMapping result = service.upsert("P1", 1002L, "SKU002");

    verify(mappingMapper, never()).insert(any(OmsSkuMapping.class));
    verify(mappingMapper).updateById(existing);
    assertEquals(1002L, existing.getOmsSkuId());
    assertEquals("SKU002", existing.getOmsSkuNo());
    assertEquals(1002L, result.getOmsSkuId());
  }

  @Test
  void upsertShouldRejectSkuIdAlreadyUsedByAnotherProduct() {
    when(mappingMapper.selectOne(any(Wrapper.class))).thenReturn(null);
    when(mappingMapper.selectList(any(Wrapper.class))).thenReturn(List.of(mapping("P2", 1001L, "SKU001")));

    IllegalArgumentException ex =
        assertThrows(
            IllegalArgumentException.class,
            () -> service.upsert("P1", 1001L, "SKU001"));

    assertTrue(ex.getMessage().contains("P2"));
    verify(mappingMapper, never()).insert(any(OmsSkuMapping.class));
  }

  @Test
  void upsertShouldRejectUnknownProduct() {
    IllegalArgumentException ex =
        assertThrows(
            IllegalArgumentException.class,
            () -> service.upsert("UNKNOWN", 1001L, "SKU001"));

    assertTrue(ex.getMessage().contains("UNKNOWN"));
    verify(mappingMapper, never()).insert(any(OmsSkuMapping.class));
  }

  @Test
  void requireMappingsShouldReturnByProductAndRejectMissing() {
    when(mappingMapper.selectList(any(Wrapper.class)))
        .thenReturn(List.of(mapping("P1", 1001L, "SKU001")));

    Map<String, Long> result = service.requireMappings(List.of("P1"));
    assertEquals(1001L, result.get("P1"));

    assertThrows(
        IllegalArgumentException.class,
        () -> service.requireMappings(List.of("P1", "P2")));
  }

  @Test
  void deleteShouldReturnTrueAndSoftDeleteExisting() {
    OmsSkuMapping existing = mapping("P1", 1001L, "SKU001");
    when(mappingMapper.selectOne(any(Wrapper.class))).thenReturn(existing);

    assertTrue(service.deleteByProductId("P1"));
    verify(mappingMapper).deleteById((java.io.Serializable) existing.getId());
  }

  @Test
  void deleteShouldReturnFalseWhenMappingDoesNotExist() {
    when(mappingMapper.selectOne(any(Wrapper.class))).thenReturn(null);

    assertFalse(service.deleteByProductId("P1"));
    verify(mappingMapper, never()).deleteById(any(java.io.Serializable.class));
  }

  private static OmsSkuMapping mapping(String productId, Long omsSkuId, String omsSkuNo) {
    OmsSkuMapping mapping = new OmsSkuMapping();
    mapping.setId(1L);
    mapping.setProductId(productId);
    mapping.setOmsSkuId(omsSkuId);
    mapping.setOmsSkuNo(omsSkuNo);
    return mapping;
  }

  private static Product product(String id) {
    return new Product(
        id,
        "slug-" + id,
        "商品 " + id,
        null,
        null,
        null,
        null,
        null,
        List.of(),
        null,
        List.of());
  }
}
