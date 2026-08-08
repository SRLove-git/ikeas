package com.ikea.server.data;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
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

/**
 * Loads every crawled JSON payload bundled in classpath:data/ at startup and
 * builds the same lookups the Next.js frontend uses (see src/lib/*.ts), so the
 * REST API exposes identical semantics.
 */
@Component
public class DataStore {

  private static final String DATA = "classpath:data/";

  private final ObjectMapper mapper;
  private final ResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();

  private final List<CatalogCategory> catalogCategories;
  private final List<CatalogCategory> channelCategories;
  private final List<MenuCategory> menuCategories;
  private final List<MenuPanel> menuPanels;
  private final JsonNode homepage;
  private final List<CatalogPage> catalogPages;
  private final List<ContentPage> contentPages;
  private final List<Product> allProducts;

  private final Map<String, CategoryMatch> categoryBySlug = new LinkedHashMap<>();
  private final Map<String, Product> productBySlug = new LinkedHashMap<>();
  private final Map<String, Product> productById = new LinkedHashMap<>();
  private final Map<String, CategoryRef> productCategoryById = new LinkedHashMap<>();
  private final Map<String, Set<String>> productCategoryNames = new HashMap<>();
  private final Map<String, CatalogPage> catalogPageBySlug = new LinkedHashMap<>();
  private final Map<String, CatalogPage> catalogPageByUrl = new LinkedHashMap<>();
  private final Map<String, ContentPage> contentPageByUrl = new LinkedHashMap<>();
  private final Map<String, List<ContentPage>> pagesByFamily = new LinkedHashMap<>();

  private record CatalogData(
      List<CatalogCategory> catalogCategories, List<CatalogCategory> channelCategories) {}

  private record MenuCategories(List<MenuCategory> categories) {}

  private record MenuPanels(List<MenuPanel> menuPanels) {}

  private record LegacyPages(List<LegacyPage> contentPages) {}

  public DataStore(ObjectMapper mapper) throws IOException {
    this.mapper = mapper;

    CatalogData catalog = read(DATA + "catalog.json", CatalogData.class);
    this.catalogCategories = List.copyOf(catalog.catalogCategories());
    this.channelCategories = List.copyOf(catalog.channelCategories());
    this.menuCategories =
        List.copyOf(read(DATA + "menu-categories.json", MenuCategories.class).categories());
    this.menuPanels =
        List.copyOf(read(DATA + "menu-panels.json", MenuPanels.class).menuPanels());
    this.homepage = read(DATA + "homepage.json", JsonNode.class);
    this.catalogPages =
        List.copyOf(read(DATA + "catalog-pages.json", new TypeReference<List<CatalogPage>>() {}));
    this.allProducts = loadProducts();
    this.contentPages = mergeContentPages();
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
    String q = query.toLowerCase(Locale.ROOT);
    return source.stream()
        .filter(product -> matches(product, q))
        .map(this::enriched)
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

  private List<Product> loadProducts() throws IOException {
    List<Product> products = new ArrayList<>();
    for (Resource resource : sortedResources("products/*.json")) {
      products.addAll(read(resource, new TypeReference<List<Product>>() {}));
    }
    return List.copyOf(products);
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
        legacy.url(), legacy.family(), null, title, legacy.title(), legacy.hero(), blocks);
  }

  private void buildIndexes() {
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
    if (contains(product.name(), q)
        || contains(product.designText(), q)
        || contains(product.productType(), q)
        || contains(product.id(), q)) {
      return true;
    }
    Set<String> names = productCategoryNames.get(product.id());
    if (names == null) {
      return false;
    }
    for (String name : names) {
      if (contains(name, q)) {
        return true;
      }
    }
    return false;
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
        && category.url().startsWith("/cn/zh/personalize-channel/")) {
      return category.url();
    }
    return "/cn/zh/cat/" + category.slug();
  }

  /** "/cn/zh/rooms/bedroom/" -> ["rooms", "bedroom"] */
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
