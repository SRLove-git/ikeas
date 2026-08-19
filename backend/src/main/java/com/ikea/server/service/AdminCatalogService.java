package com.ikea.server.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ikea.server.data.DataStore;
import com.ikea.server.entity.CatalogCategoryEntity;
import com.ikea.server.entity.CatalogPageEntity;
import com.ikea.server.mapper.CatalogCategoryEntityMapper;
import com.ikea.server.mapper.CatalogPageEntityMapper;
import com.ikea.server.model.CatalogCategory;
import com.ikea.server.model.CatalogPage;
import com.ikea.server.web.ResourceNotFoundException;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Admin CRUD for catalog categories and category landing pages. */
@Service
public class AdminCatalogService {

  private final ObjectMapper mapper;
  private final DataStore dataStore;
  private final CatalogPageEntityMapper catalogPageMapper;
  private final CatalogCategoryEntityMapper catalogCategoryMapper;

  public AdminCatalogService(
      ObjectMapper mapper,
      DataStore dataStore,
      CatalogPageEntityMapper catalogPageMapper,
      CatalogCategoryEntityMapper catalogCategoryMapper) {
    this.mapper = mapper;
    this.dataStore = dataStore;
    this.catalogPageMapper = catalogPageMapper;
    this.catalogCategoryMapper = catalogCategoryMapper;
  }

  public List<CatalogPage> listCatalogPages() {
    return dataStore.catalogPages();
  }

  public CatalogPage getCatalogPage(String slug) {
    CatalogPage page = dataStore.findCatalogPageBySlug(slug);
    if (page == null) {
      throw new ResourceNotFoundException("Catalog page not found: " + slug);
    }
    return page;
  }

  @Transactional
  public CatalogPage upsertCatalogPage(JsonNode input, String existingSlug) {
    if (input == null || !input.isObject()) {
      throw new IllegalArgumentException("落地页必须是 JSON 对象");
    }
    CatalogPage page = mapper.convertValue(input, CatalogPage.class);
    String targetSlug =
        existingSlug == null || existingSlug.isBlank() ? slugFromUrl(page.url()) : existingSlug;
    if (targetSlug == null || targetSlug.isBlank()) {
      throw new IllegalArgumentException("落地页 URL 或 slug 不能为空");
    }

    CatalogPageEntity entity = findCatalogPageEntity(targetSlug);
    String slug = page.url() == null ? targetSlug : slugFromUrl(page.url());
    String entitySlug = slug == null || slug.isBlank() ? targetSlug : slug;
    if (entity == null) {
      entity = new CatalogPageEntity();
      entity.setUrl(page.url());
      entity.setSlug(entitySlug);
      entity.setPayload(writeValue(page));
      catalogPageMapper.insert(entity);
    } else {
      entity.setUrl(page.url());
      entity.setSlug(entitySlug);
      entity.setPayload(writeValue(page));
      catalogPageMapper.updateById(entity);
    }

    dataStore.reloadFromDatabase();
    CatalogPage saved = dataStore.findCatalogPageBySlug(entitySlug);
    if (saved == null) {
      throw new IllegalStateException("落地页保存后无法读取: " + entitySlug);
    }
    return saved;
  }

  @Transactional
  public boolean deleteCatalogPage(String slug) {
    CatalogPageEntity entity = findCatalogPageEntity(slug);
    if (entity == null) {
      return false;
    }
    catalogPageMapper.deleteById(entity.getId());
    dataStore.reloadFromDatabase();
    return true;
  }

  public JsonNode getCategories() {
    ObjectNode root = mapper.createObjectNode();
    root.set("catalogCategories", mapper.valueToTree(dataStore.catalogCategories()));
    root.set("channelCategories", mapper.valueToTree(dataStore.channelCategories()));
    return root;
  }

  @Transactional
  public JsonNode updateCategories(JsonNode input) {
    if (input == null || !input.isObject()) {
      throw new IllegalArgumentException("分类数据必须是 JSON 对象");
    }
    if (!input.has("catalogCategories") || !input.has("channelCategories")) {
      throw new IllegalArgumentException("分类数据必须包含 catalogCategories 和 channelCategories");
    }

    List<CatalogCategory> catalog =
        mapper.convertValue(
            input.get("catalogCategories"), new TypeReference<List<CatalogCategory>>() {});
    List<CatalogCategory> channel =
        mapper.convertValue(
            input.get("channelCategories"), new TypeReference<List<CatalogCategory>>() {});
    syncCategories(catalog, "catalog");
    syncCategories(channel, "channel");
    dataStore.reloadFromDatabase();
    return getCategories();
  }

  private void syncCategories(List<CatalogCategory> categories, String kind) {
    Map<String, CatalogCategoryEntity> existing = new LinkedHashMap<>();
    for (CatalogCategoryEntity entity : catalogCategoryMapper.selectList(null)) {
      if (kind.equals(entity.getKind())) {
        existing.put(entity.getSlug(), entity);
      }
    }

    Set<String> seedKeys = new HashSet<>();
    for (CatalogCategory category : categories) {
      if (category.slug() == null) {
        continue;
      }
      seedKeys.add(category.slug());
      CatalogCategoryEntity entity = existing.get(category.slug());
      if (entity == null) {
        entity = new CatalogCategoryEntity();
        entity.setSlug(category.slug());
        entity.setKind(kind);
        entity.setPayload(writeValue(category));
        catalogCategoryMapper.insert(entity);
      } else {
        entity.setPayload(writeValue(category));
        catalogCategoryMapper.updateById(entity);
      }
    }
    for (Map.Entry<String, CatalogCategoryEntity> entry : existing.entrySet()) {
      if (!seedKeys.contains(entry.getKey())) {
        catalogCategoryMapper.deleteById(entry.getValue().getId());
      }
    }
  }

  private CatalogPageEntity findCatalogPageEntity(String slug) {
    return catalogPageMapper.selectOne(
        Wrappers.lambdaQuery(CatalogPageEntity.class).eq(CatalogPageEntity::getSlug, slug));
  }

  private String writeValue(Object value) {
    try {
      return mapper.writeValueAsString(value);
    } catch (Exception ex) {
      throw new IllegalArgumentException("数据序列化失败", ex);
    }
  }

  private static String slugFromUrl(String url) {
    if (url == null) {
      return null;
    }
    String[] segments = url.split("/");
    return segments.length == 0 ? null : segments[segments.length - 1];
  }
}
