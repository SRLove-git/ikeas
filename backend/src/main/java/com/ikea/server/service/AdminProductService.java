package com.ikea.server.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ikea.server.data.DataStore;
import com.ikea.server.entity.ProductEntity;
import com.ikea.server.mapper.ProductEntityMapper;
import com.ikea.server.model.CatalogCategory;
import com.ikea.server.model.CatalogPage;
import com.ikea.server.model.Product;
import com.ikea.server.web.ResourceNotFoundException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Admin CRUD for products stored in the product table. */
@Service
public class AdminProductService {

  private final ObjectMapper mapper;
  private final DataStore dataStore;
  private final ProductEntityMapper productMapper;

  public AdminProductService(
      ObjectMapper mapper, DataStore dataStore, ProductEntityMapper productMapper) {
    this.mapper = mapper;
    this.dataStore = dataStore;
    this.productMapper = productMapper;
  }

  public Map<String, Object> listProducts(String query, int page, int pageSize) {
    String q = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
    List<Product> all =
        dataStore.allProducts().stream()
            .filter(
                product ->
                    q.isBlank()
                        || contains(product.name(), q)
                        || contains(product.id(), q)
                        || contains(product.slug(), q))
            .toList();
    int safePage = Math.max(1, page);
    int safeSize = Math.min(200, Math.max(1, pageSize));
    int from = (safePage - 1) * safeSize;
    int to = Math.min(all.size(), from + safeSize);
    List<Product> items = from >= all.size() ? List.of() : all.subList(from, to);
    return Map.of(
        "items", items, "total", all.size(), "page", safePage, "pageSize", safeSize);
  }

  public JsonNode getProduct(String idOrSlug) {
    Product product = dataStore.findProductById(idOrSlug);
    if (product == null) {
      product = dataStore.findProductBySlug(idOrSlug);
    }
    if (product == null) {
      throw new ResourceNotFoundException("Product not found: " + idOrSlug);
    }

    ObjectNode node = (ObjectNode) mapper.valueToTree(product);
    ArrayNode categories = mapper.createArrayNode();
    for (Map.Entry<String, String> entry : categoriesFor(product.id()).entrySet()) {
      ObjectNode category = mapper.createObjectNode();
      category.put("name", entry.getKey());
      category.put("href", entry.getValue());
      categories.add(category);
    }
    node.set("categories", categories);
    return node;
  }

  @Transactional
  public JsonNode upsertProduct(JsonNode input, String existingIdOrSlug) {
    if (input == null || !input.isObject()) {
      throw new IllegalArgumentException("商品必须是 JSON 对象");
    }
    Product product = mapper.convertValue(input, Product.class);
    if (product.name() == null || product.name().isBlank()) {
      throw new IllegalArgumentException("商品名称不能为空");
    }

    String id = product.id();
    String slug = product.slug();
    ProductEntity entity =
        existingIdOrSlug == null || existingIdOrSlug.isBlank()
            ? findProductEntity(id, slug)
            : findProductEntity(existingIdOrSlug, existingIdOrSlug);

    if (entity == null) {
      id = id == null || id.isBlank() ? String.valueOf(System.currentTimeMillis()) : id;
      slug =
          slug == null || slug.isBlank()
              ? slugFromName(product.name(), id)
              : slug;
      Product saved = new Product(
          id,
          slug,
          product.name(),
          product.productType(),
          product.designText(),
          product.price(),
          product.originalPrice(),
          product.image(),
          product.labels(),
          product.detail(),
          product.categoryNames());
      entity = new ProductEntity();
      entity.setProductId(id);
      entity.setSlug(slug);
      entity.setPayload(writeValue(saved));
      productMapper.insert(entity);
    } else {
      id = id == null || id.isBlank() ? entity.getProductId() : id;
      slug = slug == null || slug.isBlank() ? entity.getSlug() : slug;
      Product saved = new Product(
          id,
          slug,
          product.name(),
          product.productType(),
          product.designText(),
          product.price(),
          product.originalPrice(),
          product.image(),
          product.labels(),
          product.detail(),
          product.categoryNames());
      entity.setProductId(id);
      entity.setSlug(slug);
      entity.setPayload(writeValue(saved));
      productMapper.updateById(entity);
    }

    dataStore.reloadFromDatabase();
    Product saved = dataStore.findProductById(id);
    if (saved == null) {
      throw new IllegalStateException("商品保存后无法读取: " + id);
    }
    return getProduct(id);
  }

  @Transactional
  public boolean deleteProduct(String idOrSlug) {
    ProductEntity entity = findProductEntity(idOrSlug, idOrSlug);
    if (entity == null) {
      return false;
    }
    productMapper.deleteById(entity.getId());
    dataStore.reloadFromDatabase();
    return true;
  }

  private ProductEntity findProductEntity(String productId, String slug) {
    if ((productId == null || productId.isBlank()) && (slug == null || slug.isBlank())) {
      return null;
    }
    return productMapper.selectOne(
        Wrappers.lambdaQuery(ProductEntity.class)
            .and(
                wrapper -> {
                  if (productId != null && !productId.isBlank()) {
                    wrapper.eq(ProductEntity::getProductId, productId);
                  }
                  if (slug != null && !slug.isBlank()) {
                    if (productId != null && !productId.isBlank()) {
                      wrapper.or();
                    }
                    wrapper.eq(ProductEntity::getSlug, slug);
                  }
                })
            .last("limit 1"));
  }

  private Map<String, String> categoriesFor(String productId) {
    Map<String, String> result = new LinkedHashMap<>();
    for (CatalogCategory category : dataStore.catalogCategories()) {
      if (containsProduct(category.products(), productId)) {
        result.put(category.name(), "/zh/cat/" + category.slug());
      }
    }
    for (CatalogCategory category : dataStore.channelCategories()) {
      if (containsProduct(category.products(), productId)) {
        result.put(category.name(), "/zh/cat/" + category.slug());
      }
    }
    for (CatalogPage page : dataStore.catalogPages()) {
      if (page.products() != null
          && page.products().stream().anyMatch(p -> productId.equals(p.path("id").asText(null)))) {
        result.put(page.name(), page.url());
      }
    }
    return result;
  }

  private static boolean containsProduct(List<Product> products, String productId) {
    return products != null
        && products.stream().anyMatch(product -> productId.equals(product.id()));
  }

  private static String slugFromName(String name, String id) {
    return name.trim().replaceAll("\\s+", "-") + "-" + id;
  }

  private static boolean contains(String value, String query) {
    return value != null && value.toLowerCase(Locale.ROOT).contains(query);
  }

  private String writeValue(Object value) {
    try {
      return mapper.writeValueAsString(value);
    } catch (Exception ex) {
      throw new IllegalArgumentException("商品数据序列化失败", ex);
    }
  }
}
