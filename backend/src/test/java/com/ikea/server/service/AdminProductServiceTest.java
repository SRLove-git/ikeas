package com.ikea.server.service;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ikea.server.data.DataStore;
import com.ikea.server.entity.ProductEntity;
import com.ikea.server.integration.oms.OmsSkuMappingService;
import com.ikea.server.mapper.CatalogCategoryEntityMapper;
import com.ikea.server.mapper.CatalogPageEntityMapper;
import com.ikea.server.mapper.ProductEntityMapper;
import java.util.List;
import org.junit.jupiter.api.Test;

class AdminProductServiceTest {

  @Test
  void deleteProductAlsoDeletesOmsMapping() {
    DataStore dataStore = mock(DataStore.class);
    ProductEntityMapper productMapper = mock(ProductEntityMapper.class);
    CatalogCategoryEntityMapper categoryMapper = mock(CatalogCategoryEntityMapper.class);
    CatalogPageEntityMapper pageMapper = mock(CatalogPageEntityMapper.class);
    OmsSkuMappingService mappingService = mock(OmsSkuMappingService.class);
    ProductEntity entity = new ProductEntity();
    entity.setId(7L);
    entity.setProductId("midea-demo");
    entity.setSlug("demo");
    when(productMapper.selectOne(any(Wrapper.class))).thenReturn(entity);
    when(categoryMapper.selectList(null)).thenReturn(List.of());
    when(pageMapper.selectList(null)).thenReturn(List.of());

    AdminProductService service =
        new AdminProductService(
            new ObjectMapper(),
            dataStore,
            productMapper,
            categoryMapper,
            pageMapper,
            mappingService);

    assertTrue(service.deleteProduct("midea-demo"));
    verify(mappingService).deleteByProductId("midea-demo");
    verify(productMapper).deleteById((java.io.Serializable) 7L);
    verify(dataStore).reloadFromDatabase();
  }
}
