package com.ikea.server.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ikea.server.data.DataStore;
import com.ikea.server.dto.content.ContentAdminDtos.PageUpsertRequest;
import com.ikea.server.entity.ContentPageEntity;
import com.ikea.server.entity.HomepageEntity;
import com.ikea.server.entity.MenuCategoryEntity;
import com.ikea.server.entity.MenuPanelEntity;
import com.ikea.server.mapper.ContentPageEntityMapper;
import com.ikea.server.mapper.HomepageEntityMapper;
import com.ikea.server.mapper.MenuCategoryEntityMapper;
import com.ikea.server.mapper.MenuPanelEntityMapper;
import com.ikea.server.model.ContentPage;
import com.ikea.server.model.MenuCategory;
import com.ikea.server.model.MenuPanel;
import com.ikea.server.web.ResourceNotFoundException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Administrative read/write operations for CMS content pages, homepage and menus. */
@Service
public class ContentAdminService {

  private static final List<String> FAMILY_FILES =
      List.of("customer-service", "company", "root");

  private final ObjectMapper mapper;
  private final DataStore dataStore;
  private final ContentPageEntityMapper contentPageMapper;
  private final HomepageEntityMapper homepageMapper;
  private final MenuPanelEntityMapper menuPanelMapper;
  private final MenuCategoryEntityMapper menuCategoryMapper;

  public ContentAdminService(
      ObjectMapper mapper,
      DataStore dataStore,
      ContentPageEntityMapper contentPageMapper,
      HomepageEntityMapper homepageMapper,
      MenuPanelEntityMapper menuPanelMapper,
      MenuCategoryEntityMapper menuCategoryMapper) {
    this.mapper = mapper;
    this.dataStore = dataStore;
    this.contentPageMapper = contentPageMapper;
    this.homepageMapper = homepageMapper;
    this.menuPanelMapper = menuPanelMapper;
    this.menuCategoryMapper = menuCategoryMapper;
  }

  public List<ContentPage> listPages(String family, String query) {
    String q = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
    return dataStore.contentPages().stream()
        .filter(page -> family == null || family.isBlank() || family.equals(page.family()))
        .filter(page -> FAMILY_FILES.contains(page.family()))
        .filter(
            page ->
                q.isBlank()
                    || contains(page.title(), q)
                    || contains(page.name(), q)
                    || contains(page.url(), q))
        .toList();
  }

  public List<Map<String, Object>> pageFamilies() {
    List<ContentPage> all = listPages(null, "");
    return FAMILY_FILES.stream()
        .map(
            family -> {
              long count = all.stream().filter(page -> family.equals(page.family())).count();
              return Map.<String, Object>of("name", family, "count", (int) count);
            })
        .toList();
  }

  public ContentPage getPage(String key) {
    String url = decodeUrl(key);
    ContentPage page = dataStore.findContentPage(url);
    if (page == null) {
      throw new ResourceNotFoundException("Page not found: " + url);
    }
    return page;
  }

  @Transactional
  public ContentPage upsertPage(PageUpsertRequest request, String existingKey) {
    String url = request.url().trim();
    String family = request.family() == null || request.family().isBlank()
        ? "root"
        : request.family().trim();
    List<JsonNode> blocks = request.blocks() == null ? List.of() : request.blocks();
    ContentPage page =
        new ContentPage(
            url,
            family,
            request.id(),
            request.title().trim(),
            request.name(),
            request.hero(),
            request.subtitle(),
            blocks);

    String targetUrl =
        existingKey == null || existingKey.isBlank() ? url : decodeUrl(existingKey);
    ContentPageEntity entity = findContentPageEntity(normalizeUrl(targetUrl));
    if (entity == null) {
      entity = new ContentPageEntity();
      entity.setUrl(page.url());
      entity.setFamily(page.family());
      entity.setPayload(writeValue(page));
      contentPageMapper.insert(entity);
    } else {
      entity.setUrl(page.url());
      entity.setFamily(page.family());
      entity.setPayload(writeValue(page));
      contentPageMapper.updateById(entity);
    }

    dataStore.reloadFromDatabase();
    ContentPage saved = dataStore.findContentPage(url);
    if (saved == null) {
      throw new IllegalStateException("页面保存后无法读取: " + url);
    }
    return saved;
  }

  @Transactional
  public boolean deletePage(String key) {
    String url = normalizeUrl(decodeUrl(key));
    ContentPageEntity entity = findContentPageEntity(url);
    if (entity == null) {
      return false;
    }
    contentPageMapper.deleteById(entity.getId());
    dataStore.reloadFromDatabase();
    return true;
  }

  public JsonNode getHomepage() {
    return dataStore.homepage();
  }

  @Transactional
  public JsonNode updateHomepage(JsonNode updates) {
    if (updates == null || !updates.isObject()) {
      throw new IllegalArgumentException("首页更新内容必须是对象");
    }

    JsonNode current = dataStore.homepage();
    if (!current.isObject()) {
      throw new IllegalStateException("首页数据格式不正确");
    }
    ObjectNode next = ((ObjectNode) current).deepCopy();
    updates
        .fields()
        .forEachRemaining(
            entry -> {
              if (!next.has(entry.getKey())) {
                throw new IllegalArgumentException("未知的首页字段: " + entry.getKey());
              }
              next.set(entry.getKey(), entry.getValue());
            });

    HomepageEntity entity =
        homepageMapper.selectOne(
            Wrappers.lambdaQuery(HomepageEntity.class)
                .eq(HomepageEntity::getSingletonKey, 1)
                .last("limit 1"));
    if (entity == null) {
      entity = new HomepageEntity();
      entity.setSingletonKey(1);
      entity.setPayload(writeValue(next));
      homepageMapper.insert(entity);
    } else {
      entity.setPayload(writeValue(next));
      homepageMapper.updateById(entity);
    }

    dataStore.reloadFromDatabase();
    return dataStore.homepage();
  }

  public JsonNode getMenu() {
    ObjectNode panels = mapper.createObjectNode();
    panels.set("menuPanels", mapper.valueToTree(dataStore.menuPanels()));
    if (dataStore.menuAppPromotion() != null && !dataStore.menuAppPromotion().isNull()) {
      panels.set("appPromotion", dataStore.menuAppPromotion());
    }

    ObjectNode categories = mapper.createObjectNode();
    categories.set("categories", mapper.valueToTree(dataStore.menuCategories()));

    ObjectNode root = mapper.createObjectNode();
    root.set("menuPanels", panels);
    root.set("menuCategories", categories);
    return root;
  }

  @Transactional
  public JsonNode updateMenu(JsonNode panelsNode, JsonNode categoriesNode) {
    if (panelsNode != null) {
      List<MenuPanel> panels = parseMenuPanels(panelsNode);
      syncMenuPanels(panels);
    }
    if (categoriesNode != null) {
      List<MenuCategory> categories = parseMenuCategories(categoriesNode);
      syncMenuCategories(categories);
    }

    dataStore.reloadFromDatabase();
    return getMenu();
  }

  private List<MenuPanel> parseMenuPanels(JsonNode panelsNode) {
    if (!panelsNode.isObject() || !panelsNode.has("menuPanels")) {
      throw new IllegalArgumentException("menuPanels 必须包含 menuPanels 数组");
    }
    JsonNode array = panelsNode.get("menuPanels");
    if (!array.isArray()) {
      throw new IllegalArgumentException("menuPanels.menuPanels 必须是数组");
    }
    return mapper.convertValue(array, new TypeReference<List<MenuPanel>>() {});
  }

  private List<MenuCategory> parseMenuCategories(JsonNode categoriesNode) {
    if (!categoriesNode.isObject() || !categoriesNode.has("categories")) {
      throw new IllegalArgumentException("menuCategories 必须包含 categories 数组");
    }
    JsonNode array = categoriesNode.get("categories");
    if (!array.isArray()) {
      throw new IllegalArgumentException("menuCategories.categories 必须是数组");
    }
    return mapper.convertValue(array, new TypeReference<List<MenuCategory>>() {});
  }

  private void syncMenuPanels(List<MenuPanel> panels) {
    Map<String, MenuPanelEntity> existing = new LinkedHashMap<>();
    for (MenuPanelEntity entity : menuPanelMapper.selectList(null)) {
      existing.put(entity.getLabel(), entity);
    }

    Set<String> seedKeys = new HashSet<>();
    for (MenuPanel panel : panels) {
      seedKeys.add(panel.label());
      MenuPanelEntity entity = existing.get(panel.label());
      if (entity == null) {
        entity = new MenuPanelEntity();
        entity.setLabel(panel.label());
        entity.setHref(panel.href());
        entity.setPayload(writeValue(panel));
        menuPanelMapper.insert(entity);
      } else {
        entity.setHref(panel.href());
        entity.setPayload(writeValue(panel));
        menuPanelMapper.updateById(entity);
      }
    }
    for (Map.Entry<String, MenuPanelEntity> entry : existing.entrySet()) {
      if (!seedKeys.contains(entry.getKey())) {
        menuPanelMapper.deleteById(entry.getValue().getId());
      }
    }
  }

  private void syncMenuCategories(List<MenuCategory> categories) {
    Map<String, MenuCategoryEntity> existing = new LinkedHashMap<>();
    for (MenuCategoryEntity entity : menuCategoryMapper.selectList(null)) {
      existing.put(entity.getUrl(), entity);
    }

    Set<String> seedKeys = new HashSet<>();
    for (MenuCategory category : categories) {
      seedKeys.add(category.url());
      MenuCategoryEntity entity = existing.get(category.url());
      if (entity == null) {
        entity = new MenuCategoryEntity();
        entity.setName(category.name());
        entity.setUrl(category.url());
        entity.setPayload(writeValue(category));
        menuCategoryMapper.insert(entity);
      } else {
        entity.setName(category.name());
        entity.setPayload(writeValue(category));
        menuCategoryMapper.updateById(entity);
      }
    }
    for (Map.Entry<String, MenuCategoryEntity> entry : existing.entrySet()) {
      if (!seedKeys.contains(entry.getKey())) {
        menuCategoryMapper.deleteById(entry.getValue().getId());
      }
    }
  }

  private ContentPageEntity findContentPageEntity(String normalizedUrl) {
    for (ContentPageEntity entity : contentPageMapper.selectList(null)) {
      if (normalizeUrl(entity.getUrl()).equals(normalizedUrl)) {
        return entity;
      }
    }
    return null;
  }

  private String writeValue(Object value) {
    try {
      return mapper.writeValueAsString(value);
    } catch (Exception ex) {
      throw new IllegalArgumentException("内容数据序列化失败", ex);
    }
  }

  private static boolean contains(String value, String query) {
    return value != null && value.toLowerCase(Locale.ROOT).contains(query);
  }

  private static String decodeUrl(String key) {
    if (key == null || key.isBlank()) {
      throw new IllegalArgumentException("页面 key 不能为空");
    }
    if (key.startsWith("/")) {
      return key;
    }
    for (java.util.Base64.Decoder decoder :
        List.of(java.util.Base64.getUrlDecoder(), java.util.Base64.getDecoder())) {
      try {
        String decoded = new String(decoder.decode(key), java.nio.charset.StandardCharsets.UTF_8);
        if (decoded.startsWith("/")) {
          return decoded;
        }
      } catch (IllegalArgumentException ignored) {
        // Try the next encoding.
      }
    }
    return key;
  }

  private static String normalizeUrl(String url) {
    if (url == null) {
      return "";
    }
    return url.endsWith("/") && url.length() > 1 ? url.substring(0, url.length() - 1) : url;
  }
}
