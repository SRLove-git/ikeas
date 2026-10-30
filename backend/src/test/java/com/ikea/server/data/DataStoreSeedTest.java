package com.ikea.server.data;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ikea.server.entity.CatalogCategoryEntity;
import com.ikea.server.entity.CatalogPageEntity;
import com.ikea.server.entity.ContentPageEntity;
import com.ikea.server.entity.HomepageEntity;
import com.ikea.server.entity.MenuCategoryEntity;
import com.ikea.server.entity.MenuPanelEntity;
import com.ikea.server.entity.ProductEntity;
import com.ikea.server.mapper.CatalogCategoryEntityMapper;
import com.ikea.server.mapper.CatalogPageEntityMapper;
import com.ikea.server.mapper.ContentPageEntityMapper;
import com.ikea.server.mapper.HomepageEntityMapper;
import com.ikea.server.mapper.MenuCategoryEntityMapper;
import com.ikea.server.mapper.MenuPanelEntityMapper;
import com.ikea.server.mapper.ProductEntityMapper;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionStatus;

class DataStoreSeedTest {

  @Test
  void existingCmsTablesAreNotOverwrittenByClasspathSeed() throws Exception {
    PlatformTransactionManager transactionManager = mock(PlatformTransactionManager.class);
    when(transactionManager.getTransaction(any(TransactionDefinition.class)))
        .thenReturn(mock(TransactionStatus.class));

    ProductEntityMapper products = mock(ProductEntityMapper.class);
    CatalogCategoryEntityMapper categories = mock(CatalogCategoryEntityMapper.class);
    MenuCategoryEntityMapper menuCategories = mock(MenuCategoryEntityMapper.class);
    MenuPanelEntityMapper menuPanels = mock(MenuPanelEntityMapper.class);
    CatalogPageEntityMapper catalogPages = mock(CatalogPageEntityMapper.class);
    ContentPageEntityMapper contentPages = mock(ContentPageEntityMapper.class);
    HomepageEntityMapper homepage = mock(HomepageEntityMapper.class);

    when(products.selectCount(null)).thenReturn(1L);
    when(categories.selectCount(null)).thenReturn(1L);
    when(menuCategories.selectCount(null)).thenReturn(1L);
    when(menuPanels.selectCount(null)).thenReturn(1L);
    when(catalogPages.selectCount(null)).thenReturn(1L);
    when(contentPages.selectCount(null)).thenReturn(1L);
    when(homepage.selectCount(null)).thenReturn(1L);

    ObjectMapper objectMapper =
        new ObjectMapper().configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    new DataStore(
        objectMapper,
        transactionManager,
        products,
        categories,
        menuCategories,
        menuPanels,
        catalogPages,
        contentPages,
        homepage);

    verify(products, never()).insert(any(ProductEntity.class));
    verify(products, never()).updateById(any(ProductEntity.class));
    verify(categories, never()).insert(any(CatalogCategoryEntity.class));
    verify(categories, never()).updateById(any(CatalogCategoryEntity.class));
    verify(menuCategories, never()).insert(any(MenuCategoryEntity.class));
    verify(menuPanels, never()).insert(any(MenuPanelEntity.class));
    verify(catalogPages, never()).insert(any(CatalogPageEntity.class));
    verify(contentPages, never()).insert(any(ContentPageEntity.class));
    verify(homepage, never()).insert(any(HomepageEntity.class));
    verify(transactionManager).commit(any(TransactionStatus.class));
  }
}
