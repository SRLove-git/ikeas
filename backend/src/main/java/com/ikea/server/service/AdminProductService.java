package com.ikea.server.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ikea.server.data.DataStore;
import com.ikea.server.entity.CatalogCategoryEntity;
import com.ikea.server.entity.CatalogPageEntity;
import com.ikea.server.entity.ProductEntity;
import com.ikea.server.mapper.CatalogCategoryEntityMapper;
import com.ikea.server.mapper.CatalogPageEntityMapper;
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
  private final CatalogCategoryEntityMapper catalogCategoryMapper;
  private final CatalogPageEntityMapper catalogPageMapper;

  public AdminProductService(
      ObjectMapper mapper,
      DataStore dataStore,
      ProductEntityMapper productMapper,
      CatalogCategoryEntityMapper catalogCategoryMapper,
      CatalogPageEntityMapper catalogPageMapper) {
    this.mapper = mapper;
    this.dataStore = dataStore;
    this.productMapper = productMapper;
    this.catalogCategoryMapper = catalogCategoryMapper;
    this.catalogPageMapper = catalogPageMapper;
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

    Product saved;
    if (entity == null) {
      id = id == null || id.isBlank() ? String.valueOf(System.currentTimeMillis()) : id;
      slug =
          slug == null || slug.isBlank()
              ? slugFromName(product.name(), id)
              : slug;
      saved = new Product(
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
      saved = new Product(
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

    syncProductReferences(saved, existingIdOrSlug);
    dataStore.reloadFromDatabase();
    Product reloaded = dataStore.findProductById(id);
    if (reloaded == null) {
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
    removeProductReferences(entity.getProductId(), entity.getSlug());
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

  private void syncProductReferences(Product product, String existingIdOrSlug) {
    ObjectNode productNode = mapper.valueToTree(product);
    productNode.remove("categoryNames");

    for (CatalogCategoryEntity entity : catalogCategoryMapper.selectList(null)) {
      ObjectNode payload = readObject(entity.getPayload());
      JsonNode products = payload.get("products");
      if (!(products instanceof ArrayNode array)) {
        continue;
      }
      boolean changed = false;
      for (int index = 0; index < array.size(); index++) {
        if (matchesProduct(array.get(index), product.id(), product.slug(), existingIdOrSlug)) {
          array.set(index, productNode.deepCopy());
          changed = true;
        }
      }
      if (changed) {
        entity.setPayload(writeValue(payload));
        catalogCategoryMapper.updateById(entity);
      }
    }

    for (CatalogPageEntity entity : catalogPageMapper.selectList(null)) {
      ObjectNode payload = readObject(entity.getPayload());
      JsonNode products = payload.get("products");
      if (!(products instanceof ArrayNode array)) {
        continue;
      }
      boolean changed = false;
      for (JsonNode candidate : array) {
        if (!(candidate instanceof ObjectNode target)
            || !matchesProduct(target, product.id(), product.slug(), existingIdOrSlug)) {
          continue;
        }
        putNullable(target, "name", product.name());
        target.set("price", mapper.valueToTree(product.price()));
        putNullable(target, "image", product.image());
        putNullable(target, "productType", product.productType());
        putNullable(target, "designText", product.designText());
        putNullable(target, "seoSlug", catalogPageSeoSlug(product));
        changed = true;
      }
      if (changed) {
        entity.setPayload(writeValue(payload));
        catalogPageMapper.updateById(entity);
      }
    }
  }

  private void removeProductReferences(String productId, String slug) {
    for (CatalogCategoryEntity entity : catalogCategoryMapper.selectList(null)) {
      ObjectNode payload = readObject(entity.getPayload());
      JsonNode products = payload.get("products");
      if (products instanceof ArrayNode array && removeMatches(array, productId, slug)) {
        entity.setPayload(writeValue(payload));
        catalogCategoryMapper.updateById(entity);
      }
    }

    for (CatalogPageEntity entity : catalogPageMapper.selectList(null)) {
      ObjectNode payload = readObject(entity.getPayload());
      boolean changed = false;
      if (payload.get("products") instanceof ArrayNode products) {
        changed = removeMatches(products, productId, slug);
      }
      if (payload.get("productIds") instanceof ArrayNode productIds) {
        for (int index = productIds.size() - 1; index >= 0; index--) {
          JsonNode candidate = productIds.get(index);
          String candidateId = candidate.isObject() ? candidate.path("id").asText("") : candidate.asText("");
          if (productId.equals(candidateId)) {
            productIds.remove(index);
            changed = true;
          }
        }
      }
      if (changed) {
        entity.setPayload(writeValue(payload));
        catalogPageMapper.updateById(entity);
      }
    }
  }

  private boolean removeMatches(ArrayNode array, String productId, String slug) {
    boolean changed = false;
    for (int index = array.size() - 1; index >= 0; index--) {
      if (matchesProduct(array.get(index), productId, slug, null)) {
        array.remove(index);
        changed = true;
      }
    }
    return changed;
  }

  private static boolean matchesProduct(
      JsonNode candidate, String productId, String slug, String existingIdOrSlug) {
    String candidateId = candidate.path("id").asText("");
    String candidateSlug = candidate.path("slug").asText("");
    return productId.equals(candidateId)
        || slug.equals(candidateSlug)
        || (existingIdOrSlug != null
            && (existingIdOrSlug.equals(candidateId) || existingIdOrSlug.equals(candidateSlug)));
  }

  private static String catalogPageSeoSlug(Product product) {
    String suffix = "-" + product.id();
    return product.slug().endsWith(suffix)
        ? product.slug().substring(0, product.slug().length() - suffix.length())
        : product.slug();
  }

  private ObjectNode readObject(String payload) {
    try {
      return (ObjectNode) mapper.readTree(payload);
    } catch (Exception ex) {
      throw new IllegalArgumentException("商品关联数据解析失败", ex);
    }
  }

  private static void putNullable(ObjectNode target, String field, String value) {
    if (value == null) {
      target.putNull(field);
    } else {
      target.put(field, value);
    }
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
