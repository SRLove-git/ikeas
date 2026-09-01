package com.ikea.server.data;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
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
import com.ikea.server.model.CatalogCategory;
import com.ikea.server.model.CatalogPage;
import com.ikea.server.model.CategoryMatch;
import com.ikea.server.model.CategoryRef;
import com.ikea.server.model.ContentPage;
import com.ikea.server.model.LegacyPage;
import com.ikea.server.model.MenuCategory;
import com.ikea.server.model.MenuPanel;
import com.ikea.server.model.Product;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;
import java.util.Collection;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Reads static content from PostgreSQL after an idempotent first-start seed
 * from classpath:data/, then builds the same lookups the Next.js frontend uses
 * (see src/lib/*.ts), so the REST API exposes identical semantics.
 */
@Component
public class DataStore {

  private static final String DATA = "classpath:data/";

  private final ObjectMapper mapper;
  private final ResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
  private final TransactionTemplate transactionTemplate;
  private final ProductEntityMapper productEntityMapper;
  private final CatalogCategoryEntityMapper catalogCategoryEntityMapper;
  private final MenuCategoryEntityMapper menuCategoryEntityMapper;
  private final MenuPanelEntityMapper menuPanelEntityMapper;
  private final CatalogPageEntityMapper catalogPageEntityMapper;
  private final ContentPageEntityMapper contentPageEntityMapper;
  private final HomepageEntityMapper homepageEntityMapper;

  private List<CatalogCategory> catalogCategories;
  private List<CatalogCategory> channelCategories;
  private List<MenuCategory> menuCategories;
  private List<MenuPanel> menuPanels;
  private JsonNode homepage;
  private List<CatalogPage> catalogPages;
  private List<ContentPage> contentPages;
  private List<Product> allProducts;
  private JsonNode menuAppPromotion;

  private final Map<String, CategoryMatch> categoryBySlug = new LinkedHashMap<>();
  private final Map<String, Product> productBySlug = new LinkedHashMap<>();
  private final Map<String, Product> productById = new LinkedHashMap<>();
  private final Map<String, CategoryRef> productCategoryById = new LinkedHashMap<>();
  private final Map<String, Set<String>> productCategoryNames = new HashMap<>();
  private final Map<String, Set<String>> productAliasNames = new HashMap<>();
  private final Map<String, CatalogPage> catalogPageBySlug = new LinkedHashMap<>();
  private final Map<String, CatalogPage> catalogPageByUrl = new LinkedHashMap<>();
  private final Map<String, ContentPage> contentPageByUrl = new LinkedHashMap<>();
  private final Map<String, List<ContentPage>> pagesByFamily = new LinkedHashMap<>();

  private record CatalogData(
      List<CatalogCategory> catalogCategories, List<CatalogCategory> channelCategories) {}

  private record MenuCategories(List<MenuCategory> categories) {}

  private record MenuPanels(List<MenuPanel> menuPanels, JsonNode appPromotion) {}

  private record LegacyPages(List<LegacyPage> contentPages) {}

  private record SeedData(
      List<CatalogCategory> catalogCategories,
      List<CatalogCategory> channelCategories,
      List<MenuCategory> menuCategories,
      List<MenuPanel> menuPanels,
      JsonNode homepage,
      List<CatalogPage> catalogPages,
      List<ContentPage> contentPages,
      List<Product> products) {}

  public DataStore(
      ObjectMapper mapper,
      PlatformTransactionManager transactionManager,
      ProductEntityMapper productEntityMapper,
      CatalogCategoryEntityMapper catalogCategoryEntityMapper,
      MenuCategoryEntityMapper menuCategoryEntityMapper,
      MenuPanelEntityMapper menuPanelEntityMapper,
      CatalogPageEntityMapper catalogPageEntityMapper,
      ContentPageEntityMapper contentPageEntityMapper,
      HomepageEntityMapper homepageEntityMapper)
      throws IOException {
    this.mapper = mapper;
    this.transactionTemplate = new TransactionTemplate(transactionManager);
    this.productEntityMapper = productEntityMapper;
    this.catalogCategoryEntityMapper = catalogCategoryEntityMapper;
    this.menuCategoryEntityMapper = menuCategoryEntityMapper;
    this.menuPanelEntityMapper = menuPanelEntityMapper;
    this.catalogPageEntityMapper = catalogPageEntityMapper;
    this.contentPageEntityMapper = contentPageEntityMapper;
    this.homepageEntityMapper = homepageEntityMapper;

    SeedData seed = readSeedData();
    transactionTemplate.executeWithoutResult(status -> seedDatabase(seed));

    reloadFromDatabase();
  }

  /** Reloads all static content from PostgreSQL and rebuilds in-memory indexes. */
  public synchronized void reloadFromDatabase() {
    CatalogData catalog = loadCatalogCategories();
    this.catalogCategories = catalog.catalogCategories();
    this.channelCategories = catalog.channelCategories();
    this.menuCategories = loadMenuCategories();
    this.menuPanels = loadMenuPanels();
    this.homepage = loadHomepage();
    this.catalogPages = loadCatalogPages();
    this.allProducts = loadProducts();
    this.contentPages = loadContentPages();
    this.menuAppPromotion = loadMenuAppPromotion();
    buildIndexes();
  }

  // ------------------------------------------------------------------ data

  public List<CatalogCategory> catalogCategories() {
    return catalogCategories;
  }

  public List<CatalogCategory> channelCategories() {
    return channelCategories;
  }

  public List<MenuCategory> menuCategories() {
    return menuCategories;
  }

  public List<MenuPanel> menuPanels() {
    return menuPanels;
  }

  public JsonNode homepage() {
    return homepage;
  }

  public JsonNode menuAppPromotion() {
    return menuAppPromotion;
  }

  public List<CatalogPage> catalogPages() {
    return catalogPages;
  }

  public List<ContentPage> contentPages() {
    return contentPages;
  }

  public List<Product> allProducts() {
    return allProducts;
  }

  /** Every distinct product: catalog-category products first, detail-page products fill gaps. */
  public List<Product> searchableProducts() {
    return List.copyOf(productBySlug.values());
  }

  // ------------------------------------------------------------- lookups

  public CategoryMatch findCategoryBySlug(String slug) {
    return categoryBySlug.get(slug);
  }

  public Product findProductBySlug(String slug) {
    return productBySlug.get(slug);
  }

  public Product findProductById(String id) {
    return productById.get(id);
  }

  public CategoryRef findCategoryForProductId(String id) {
    return productCategoryById.get(id);
  }

  public CatalogPage findCatalogPageBySlug(String slug) {
    return catalogPageBySlug.get(slug);
  }

  public CatalogPage findCatalogPageByUrl(String url) {
    return catalogPageByUrl.get(normalizeUrl(url));
  }

  public ContentPage findContentPage(String url) {
    return contentPageByUrl.get(normalizeUrl(url));
  }

  public List<ContentPage> pagesByFamily(String family) {
    return pagesByFamily.getOrDefault(family, List.of());
  }

  public List<ContentPage> pagesAtDepth(String family, int depth) {
    return pagesByFamily(family).stream()
        .filter(page -> segments(page.url()).length == depth)
        .toList();
  }

  public List<ContentPage> pagesDeeper(String family, int minDepth) {
    return pagesByFamily(family).stream()
        .filter(page -> segments(page.url()).length > minDepth)
        .toList();
  }

  public List<String> families() {
    return List.copyOf(pagesByFamily.keySet());
  }

  // ------------------------------------------------------------- search

  public List<Product> searchProducts(String query, int limit) {
    return filterProducts(searchableProducts(), query).stream().limit(limit).toList();
  }

  public List<Product> filterProducts(List<Product> source, String query) {
    if (query == null || query.isBlank()) {
      return source;
    }
    String q = query.trim().toLowerCase(Locale.ROOT);
    return source.stream()
        .filter(product -> matches(product, q))
        .map(this::enriched)
        .sorted(Comparator.comparingInt((Product product) -> relevance(product, q)).reversed())
        .toList();
  }

  public List<ContentPage> searchContentPages(String query, int limit) {
    String q = query.toLowerCase(Locale.ROOT);
    return contentPages.stream()
        .filter(
            page ->
                contains(page.title(), q)
                    || contains(page.name(), q)
                    || contains(page.url(), q))
        .limit(limit)
        .toList();
  }

  public List<CatalogPage> searchCatalogPages(String query, int limit) {
    String q = query.toLowerCase(Locale.ROOT);
    return catalogPages.stream()
        .filter(
            page ->
                contains(page.name(), q)
                    || contains(page.url(), q)
                    || contains(page.description(), q))
        .limit(limit)
        .toList();
  }

  // ------------------------------------------------------------ loading

  private SeedData readSeedData() throws IOException {
    CatalogData catalog = read(DATA + "catalog.json", CatalogData.class);
    MenuPanels menuPanels = read(DATA + "menu-panels.json", MenuPanels.class);
    this.menuAppPromotion = menuPanels.appPromotion();
    return new SeedData(
        List.copyOf(catalog.catalogCategories()),
        List.copyOf(catalog.channelCategories()),
        List.copyOf(read(DATA + "menu-categories.json", MenuCategories.class).categories()),
        List.copyOf(menuPanels.menuPanels()),
        read(DATA + "homepage.json", JsonNode.class),
        List.copyOf(read(DATA + "catalog-pages.json", new TypeReference<List<CatalogPage>>() {})),
        mergeContentPages(),
        loadProductsFromJson());
  }

  private JsonNode loadMenuAppPromotion() {
    return read(DATA + "menu-panels.json", new TypeReference<MenuPanels>() {}).appPromotion();
  }

  private void seedDatabase(SeedData seed) {
    syncProducts(seed.products());
    syncCatalogCategories(seed.catalogCategories(), "catalog");
    syncCatalogCategories(seed.channelCategories(), "channel");
    syncMenuCategories(seed.menuCategories());
    syncMenuPanels(seed.menuPanels());
    syncCatalogPages(seed.catalogPages());
    syncContentPages(seed.contentPages());
    syncHomepage(seed.homepage());
  }

  private void syncProducts(List<Product> products) {
    Map<String, ProductEntity> existing = new LinkedHashMap<>();
    for (ProductEntity entity : productEntityMapper.selectList(null)) {
      existing.put(entity.getProductId(), entity);
    }

    Set<String> seedIds = new HashSet<>();
    for (Product product : products) {
      if (product.id() == null || product.slug() == null) {
        continue;
      }
      seedIds.add(product.id());
      ProductEntity entity = existing.get(product.id());
      if (entity == null) {
        entity = new ProductEntity();
        entity.setProductId(product.id());
        entity.setSlug(product.slug());
        entity.setPayload(writeValue(product));
        productEntityMapper.insert(entity);
      } else {
        entity.setSlug(product.slug());
        entity.setPayload(writeValue(product));
        productEntityMapper.updateById(entity);
      }
    }
    for (Map.Entry<String, ProductEntity> entry : existing.entrySet()) {
      if (!seedIds.contains(entry.getKey())) {
        productEntityMapper.deleteById(entry.getValue().getId());
      }
    }
  }

  private void syncCatalogCategories(List<CatalogCategory> categories, String kind) {
    Map<String, CatalogCategoryEntity> existing = new LinkedHashMap<>();
    for (CatalogCategoryEntity entity : catalogCategoryEntityMapper.selectList(null)) {
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
        catalogCategoryEntityMapper.insert(entity);
      } else {
        entity.setPayload(writeValue(category));
        catalogCategoryEntityMapper.updateById(entity);
      }
    }
    for (Map.Entry<String, CatalogCategoryEntity> entry : existing.entrySet()) {
      if (!seedKeys.contains(entry.getKey())) {
        catalogCategoryEntityMapper.deleteById(entry.getValue().getId());
      }
    }
  }

  private void syncMenuCategories(List<MenuCategory> categories) {
    Map<String, MenuCategoryEntity> existing = new LinkedHashMap<>();
    for (MenuCategoryEntity entity : menuCategoryEntityMapper.selectList(null)) {
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
        menuCategoryEntityMapper.insert(entity);
      } else {
        entity.setName(category.name());
        entity.setPayload(writeValue(category));
        menuCategoryEntityMapper.updateById(entity);
      }
    }
    for (Map.Entry<String, MenuCategoryEntity> entry : existing.entrySet()) {
      if (!seedKeys.contains(entry.getKey())) {
        menuCategoryEntityMapper.deleteById(entry.getValue().getId());
      }
    }
  }

  private void syncMenuPanels(List<MenuPanel> panels) {
    Map<String, MenuPanelEntity> existing = new LinkedHashMap<>();
    for (MenuPanelEntity entity : menuPanelEntityMapper.selectList(null)) {
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
        menuPanelEntityMapper.insert(entity);
      } else {
        entity.setHref(panel.href());
        entity.setPayload(writeValue(panel));
        menuPanelEntityMapper.updateById(entity);
      }
    }
    for (Map.Entry<String, MenuPanelEntity> entry : existing.entrySet()) {
      if (!seedKeys.contains(entry.getKey())) {
        menuPanelEntityMapper.deleteById(entry.getValue().getId());
      }
    }
  }

  private void syncCatalogPages(List<CatalogPage> pages) {
    Map<String, CatalogPageEntity> existing = new LinkedHashMap<>();
    for (CatalogPageEntity entity : catalogPageEntityMapper.selectList(null)) {
      existing.put(entity.getSlug(), entity);
    }

    Set<String> seedKeys = new HashSet<>();
    for (CatalogPage page : pages) {
      String slug = slugFromUrl(page.url());
      String entitySlug = slug == null ? (page.id() == null ? page.url() : page.id()) : slug;
      seedKeys.add(entitySlug);
      CatalogPageEntity entity = existing.get(entitySlug);
      if (entity == null) {
        entity = new CatalogPageEntity();
        entity.setUrl(page.url());
        entity.setSlug(entitySlug);
        entity.setPayload(writeValue(page));
        catalogPageEntityMapper.insert(entity);
      } else {
        entity.setUrl(page.url());
        entity.setSlug(entitySlug);
        entity.setPayload(writeValue(page));
        catalogPageEntityMapper.updateById(entity);
      }
    }
    for (Map.Entry<String, CatalogPageEntity> entry : existing.entrySet()) {
      if (!seedKeys.contains(entry.getKey())) {
        catalogPageEntityMapper.deleteById(entry.getValue().getId());
      }
    }
  }

  private void syncContentPages(List<ContentPage> pages) {
    Map<String, ContentPageEntity> existing = new LinkedHashMap<>();
    for (ContentPageEntity entity : contentPageEntityMapper.selectList(null)) {
      existing.put(normalizeUrl(entity.getUrl()), entity);
    }

    Set<String> seedKeys = new HashSet<>();
    for (ContentPage page : pages) {
      String key = normalizeUrl(page.url());
      seedKeys.add(key);
      ContentPageEntity entity = existing.get(key);
      String family = page.family() == null ? "root" : page.family();
      if (entity == null) {
        entity = new ContentPageEntity();
        entity.setUrl(page.url());
        entity.setFamily(family);
        entity.setPayload(writeValue(page));
        contentPageEntityMapper.insert(entity);
      } else {
        entity.setUrl(page.url());
        entity.setFamily(family);
        entity.setPayload(writeValue(page));
        contentPageEntityMapper.updateById(entity);
      }
    }
    for (Map.Entry<String, ContentPageEntity> entry : existing.entrySet()) {
      if (!seedKeys.contains(entry.getKey())) {
        contentPageEntityMapper.deleteById(entry.getValue().getId());
      }
    }
  }

  private void syncHomepage(JsonNode homepage) {
    HomepageEntity entity =
        homepageEntityMapper.selectOne(
            Wrappers.lambdaQuery(HomepageEntity.class).eq(HomepageEntity::getSingletonKey, 1));
    if (entity == null) {
      entity = new HomepageEntity();
      entity.setSingletonKey(1);
      entity.setPayload(writeValue(homepage));
      homepageEntityMapper.insert(entity);
    } else {
      entity.setPayload(writeValue(homepage));
      homepageEntityMapper.updateById(entity);
    }
  }

  private CatalogData loadCatalogCategories() {
    List<CatalogCategoryEntity> entities =
        catalogCategoryEntityMapper.selectList(
            Wrappers.lambdaQuery(CatalogCategoryEntity.class)
                .orderByAsc(CatalogCategoryEntity::getCreatedAt)
                .orderByAsc(CatalogCategoryEntity::getId));
    List<CatalogCategory> catalogCategories = new ArrayList<>();
    List<CatalogCategory> channelCategories = new ArrayList<>();
    for (CatalogCategoryEntity entity : entities) {
      CatalogCategory category = readValue(entity.getPayload(), CatalogCategory.class);
      if ("channel".equals(entity.getKind())) {
        channelCategories.add(category);
      } else {
        catalogCategories.add(category);
      }
    }
    return new CatalogData(List.copyOf(catalogCategories), List.copyOf(channelCategories));
  }

  private List<MenuCategory> loadMenuCategories() {
    return menuCategoryEntityMapper.selectList(
            Wrappers.lambdaQuery(MenuCategoryEntity.class)
                .orderByAsc(MenuCategoryEntity::getCreatedAt)
                .orderByAsc(MenuCategoryEntity::getId))
        .stream()
        .map(entity -> readValue(entity.getPayload(), MenuCategory.class))
        .toList();
  }

  private List<MenuPanel> loadMenuPanels() {
    return menuPanelEntityMapper.selectList(
            Wrappers.lambdaQuery(MenuPanelEntity.class)
                .orderByAsc(MenuPanelEntity::getCreatedAt)
                .orderByAsc(MenuPanelEntity::getId))
        .stream()
        .map(entity -> readValue(entity.getPayload(), MenuPanel.class))
        .toList();
  }

  private List<CatalogPage> loadCatalogPages() {
    return catalogPageEntityMapper.selectList(
            Wrappers.lambdaQuery(CatalogPageEntity.class)
                .orderByAsc(CatalogPageEntity::getCreatedAt)
                .orderByAsc(CatalogPageEntity::getId))
        .stream()
        .map(entity -> readValue(entity.getPayload(), CatalogPage.class))
        .toList();
  }

  private List<ContentPage> loadContentPages() {
    return contentPageEntityMapper.selectList(
            Wrappers.lambdaQuery(ContentPageEntity.class)
                .orderByAsc(ContentPageEntity::getCreatedAt)
                .orderByAsc(ContentPageEntity::getId))
        .stream()
        .map(entity -> readValue(entity.getPayload(), ContentPage.class))
        .toList();
  }

  private JsonNode loadHomepage() {
    HomepageEntity entity =
        homepageEntityMapper.selectOne(
            Wrappers.lambdaQuery(HomepageEntity.class)
                .eq(HomepageEntity::getSingletonKey, 1)
                .last("limit 1"));
    return entity == null ? mapper.createObjectNode() : readValue(entity.getPayload(), JsonNode.class);
  }

  private List<Product> loadProducts() {
    return productEntityMapper.selectList(
            Wrappers.lambdaQuery(ProductEntity.class)
                .orderByAsc(ProductEntity::getCreatedAt)
                .orderByAsc(ProductEntity::getId))
        .stream()
        .map(entity -> readValue(entity.getPayload(), Product.class))
        .toList();
  }

  private List<Product> loadProductsFromJson() throws IOException {
    List<Product> products = new ArrayList<>();
    for (Resource resource : sortedResources("products/*.json")) {
      String filename = resource.getFilename();
      if (filename != null && filename.endsWith(".en.json")) {
        continue;
      }
      products.addAll(read(resource, new TypeReference<List<Product>>() {}));
    }
    return List.copyOf(products);
  }

  private String writeValue(Object value) {
    try {
      return mapper.writeValueAsString(value);
    } catch (IOException ex) {
      throw new UncheckedIOException(ex);
    }
  }

  private <T> T readValue(String payload, Class<T> type) {
    try {
      return mapper.readValue(payload, type);
    } catch (IOException ex) {
      throw new UncheckedIOException(ex);
    }
  }

  private List<ContentPage> mergeContentPages() throws IOException {
    // New crawled pages win; legacy pages fill the gaps (mirrors pages-index.ts).
    Map<String, ContentPage> byUrl = new LinkedHashMap<>();
    for (Resource resource : sortedResources("pages/*.json")) {
      for (ContentPage page : read(resource, new TypeReference<List<ContentPage>>() {})) {
        byUrl.putIfAbsent(normalizeUrl(page.url()), page);
      }
    }
    for (LegacyPage legacy :
        read(DATA + "legacy-pages.json", LegacyPages.class).contentPages()) {
      byUrl.putIfAbsent(normalizeUrl(legacy.url()), toContentPage(legacy));
    }
    return List.copyOf(byUrl.values());
  }

  private ContentPage toContentPage(LegacyPage legacy) {
    List<JsonNode> blocks = new ArrayList<>();
    if (legacy.sections() != null) {
      for (JsonNode section : legacy.sections()) {
        ObjectNode block = mapper.createObjectNode();
        block.put("type", "pub-text");
        String heading = section.path("heading").asText(null);
        block.put("title", (heading == null || heading.isEmpty()) ? null : heading);

        String text = section.path("text").asText("");
        ArrayNode texts = block.putArray("texts");
        if (text != null && !text.isEmpty()) {
          texts.add(text);
        }

        String image = section.path("image").isNull() ? null : section.path("image").asText();
        ArrayNode images = block.putArray("images");
        if (image != null && !image.isEmpty()) {
          images.add(image);
        }

        block.putArray("links");
        block.put("settings", (JsonNode) null);
        blocks.add(block);
      }
    }
    String title = legacy.h1() != null && !legacy.h1().isEmpty() ? legacy.h1() : legacy.title();
    return new ContentPage(
        legacy.url(), legacy.family(), null, title, legacy.title(), legacy.hero(), null, blocks);
  }

  private void buildIndexes() {
    categoryBySlug.clear();
    productBySlug.clear();
    productById.clear();
    productCategoryById.clear();
    productCategoryNames.clear();
    productAliasNames.clear();
    catalogPageBySlug.clear();
    catalogPageByUrl.clear();
    contentPageByUrl.clear();
    pagesByFamily.clear();

    // Product -> category attribution: catalog pages win, then categories
    // (mirrors findCategoryNameForProductId in src/lib/catalog.ts).
    for (CatalogPage page : catalogPages) {
      String slug = slugFromUrl(page.url());
      if (slug != null) {
        catalogPageBySlug.putIfAbsent(slug, page);
      }
      catalogPageByUrl.putIfAbsent(normalizeUrl(page.url()), page);
      CategoryRef ref = new CategoryRef(page.name(), page.url());
      if (page.products() != null) {
        for (JsonNode product : page.products()) {
          String id = product.path("id").asText(null);
          if (id != null && !id.isEmpty()) {
            productCategoryById.putIfAbsent(id, ref);
            if (page.name() != null && !page.name().isBlank()) {
              productCategoryNames
                  .computeIfAbsent(id, ignored -> new HashSet<>())
                  .add(page.name());
            }
          }
        }
      }
    }

    List<CatalogCategory> collections = new ArrayList<>(catalogCategories);
    collections.addAll(channelCategories);
    for (CatalogCategory category : collections) {
      categoryBySlug.putIfAbsent(category.slug(), new CategoryMatch(category, null));
      if (category.subs() != null) {
        for (JsonNode sub : category.subs()) {
          String slug = sub.path("slug").asText(null);
          if (slug != null && !slug.isEmpty()) {
            categoryBySlug.putIfAbsent(slug, new CategoryMatch(category, sub));
          }
        }
      }
      CategoryRef ref = new CategoryRef(category.name(), collectionHref(category));
      if (category.products() != null) {
        for (Product product : category.products()) {
          indexProduct(product, ref);
          if (product.id() != null
              && category.name() != null
              && !category.name().isBlank()) {
            productCategoryNames
                .computeIfAbsent(product.id(), ignored -> new HashSet<>())
                .add(category.name());
          }
        }
      }
    }

    // Detail-page products (products-part-N.json) fill the remaining slots.
    for (Product product : allProducts) {
      productBySlug.putIfAbsent(product.slug(), product);
      productById.putIfAbsent(product.id(), product);
    }

    // Navigation sub-category names are useful aliases: e.g. "早孕检测" should
    // find the HCG pregnancy test even though that term is absent from the
    // product name and detail fields.
    for (MenuCategory menu : menuCategories) {
      if (menu.subs() == null) {
        continue;
      }
      for (JsonNode sub : menu.subs()) {
        Product product = productBySlug.get(slugFromUrl(sub.path("url").asText(null)));
        if (product == null || product.id() == null) {
          continue;
        }
        Set<String> aliases =
            productAliasNames.computeIfAbsent(product.id(), ignored -> new HashSet<>());
        addNonBlank(aliases, menu.name());
        addNonBlank(aliases, sub.path("name").asText(null));
      }
    }

    for (ContentPage page : contentPages) {
      contentPageByUrl.put(normalizeUrl(page.url()), page);
      pagesByFamily
          .computeIfAbsent(page.family(), ignored -> new ArrayList<>())
          .add(page);
    }
    pagesByFamily.replaceAll((family, pages) -> List.copyOf(pages));
  }

  private void indexProduct(Product product, CategoryRef ref) {
    if (product.slug() != null) {
      productBySlug.putIfAbsent(product.slug(), product);
    }
    if (product.id() != null) {
      productById.putIfAbsent(product.id(), product);
      productCategoryById.putIfAbsent(product.id(), ref);
    }
  }

  private Resource[] sortedResources(String pattern) throws IOException {
    Resource[] resources = resolver.getResources(DATA + pattern);
    Arrays.sort(resources, Comparator.comparing(resource -> resource.getFilename()));
    return resources;
  }

  private <T> T read(String location, Class<T> type) throws IOException {
    return mapper.readValue(resolver.getResource(location).getInputStream(), type);
  }

  private <T> T read(Resource resource, TypeReference<T> type) throws IOException {
    return mapper.readValue(resource.getInputStream(), type);
  }

  private <T> T read(String location, TypeReference<T> type) {
    try {
      return mapper.readValue(resolver.getResource(location).getInputStream(), type);
    } catch (IOException ex) {
      throw new UncheckedIOException(ex);
    }
  }

  // ------------------------------------------------------------ helpers

  private boolean matches(Product product, String q) {
    String[] terms = q.split("\\s+");
    for (String term : terms) {
      if (!term.isBlank() && productTermScore(product, term) == 0) {
        return false;
      }
    }
    return true;
  }

  private int relevance(Product product, String q) {
    int score = 0;
    for (String term : q.split("\\s+")) {
      if (!term.isBlank()) {
        score += productTermScore(product, term);
      }
    }

    String compactQuery = q.replaceAll("\\s+", "");
    String compactName = product.name() == null
        ? ""
        : product.name().toLowerCase(Locale.ROOT).replaceAll("\\s+", "");
    if (!compactQuery.isBlank() && compactName.contains(compactQuery)) {
      score += 25;
    }
    return score;
  }

  private int productTermScore(Product product, String term) {
    int best = fieldScore(product.name(), term);
    best = Math.max(best, fieldScore(product.productType(), term) * 4 / 5);
    best = Math.max(best, fieldScore(product.designText(), term) * 7 / 10);

    Set<String> categoryNames = productCategoryNames.get(product.id());
    if (categoryNames != null) {
      for (String name : categoryNames) {
        best = Math.max(best, fieldScore(name, term) * 3 / 4);
      }
    }

    Set<String> aliases = productAliasNames.get(product.id());
    if (aliases != null) {
      for (String alias : aliases) {
        best = Math.max(best, fieldScore(alias, term) * 3 / 4);
      }
    }

    if (product.id() != null && product.id().equals(term)) {
      best = Math.max(best, 110);
    }
    if (contains(product.slug(), term)) {
      best = Math.max(best, 60);
    }
    if (detailText(product.detail()).contains(term)) {
      best = Math.max(best, 35);
    }
    return best;
  }

  private int fieldScore(String value, String term) {
    if (value == null || value.isBlank()) {
      return 0;
    }
    String normalized = java.text.Normalizer.normalize(value, java.text.Normalizer.Form.NFKC)
        .toLowerCase(Locale.ROOT)
        .trim();
    if (normalized.equals(term)) {
      return 120;
    }
    if (normalized.startsWith(term)) {
      return 100;
    }
    if (normalized.contains(term)) {
      return 80;
    }
    return 0;
  }

  private String detailText(JsonNode detail) {
    StringBuilder text = new StringBuilder();
    collectText(detail, text);
    return java.text.Normalizer.normalize(text, java.text.Normalizer.Form.NFKC)
        .toLowerCase(Locale.ROOT);
  }

  private void collectText(JsonNode node, StringBuilder text) {
    if (node == null || node.isNull()) {
      return;
    }
    if (node.isTextual()) {
      text.append(node.asText()).append(' ');
    } else if (node.isArray() || node.isObject()) {
      node.elements().forEachRemaining(child -> collectText(child, text));
    }
  }

  private static void addNonBlank(Set<String> values, String value) {
    if (value != null && !value.isBlank()) {
      values.add(value);
    }
  }

  /** Returns a copy carrying category names (used by search responses). */
  private Product enriched(Product product) {
    Collection<String> names = productCategoryNames.get(product.id());
    if (names == null || names.isEmpty()) {
      return product;
    }
    return new Product(
        product.id(),
        product.slug(),
        product.name(),
        product.productType(),
        product.designText(),
        product.price(),
        product.originalPrice(),
        product.image(),
        product.labels(),
        product.detail(),
        List.copyOf(names));
  }

  private static boolean contains(String value, String q) {
    return value != null && value.toLowerCase(Locale.ROOT).contains(q);
  }

  private static String collectionHref(CatalogCategory category) {
    if (category.url() != null
        && category.url().startsWith("/zh/personalize-channel/")) {
      return category.url();
    }
    return "/zh/cat/" + category.slug();
  }

  /** "/zh/rooms/bedroom/" -> ["rooms", "bedroom"] */
  private static String[] segments(String url) {
    if (url == null) {
      return new String[0];
    }
    String[] parts =
        Arrays.stream(url.split("/")).filter(segment -> !segment.isEmpty()).toArray(String[]::new);
    if (parts.length <= 2) {
      return new String[0];
    }
    return Arrays.copyOfRange(parts, 2, parts.length);
  }

  private static String slugFromUrl(String url) {
    if (url == null) {
      return null;
    }
    String[] segments = url.split("/");
    return segments.length == 0 ? null : segments[segments.length - 1];
  }

  private static String normalizeUrl(String url) {
    if (url == null) {
      return "";
    }
    return url.endsWith("/") && url.length() > 1 ? url.substring(0, url.length() - 1) : url;
  }
}
