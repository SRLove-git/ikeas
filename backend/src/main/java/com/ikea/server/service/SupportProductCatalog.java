package com.ikea.server.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.ikea.server.data.DataStore;
import com.ikea.server.entity.OmsSkuMapping;
import com.ikea.server.integration.oms.OmsChannel;
import com.ikea.server.integration.oms.OmsProductSyncService;
import com.ikea.server.integration.oms.OmsSkuMappingService;
import com.ikea.server.model.CatalogCategory;
import com.ikea.server.model.CategoryRef;
import com.ikea.server.model.Product;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;

/**
 * 把商城商品目录转换成 AI 客服可读的商品证据。
 *
 * <p>AI 服务不直连商城数据库：每次对话由商城后端按用户问题从完整商品目录中选出相关商品，
 * 附带当前价格、OMS 库存（已接入时）和商品页链接，再随签名请求交给 AI。未命中具体商品但
 * 用户想浏览时，返回类目概览，让客服能说明“卖什么”并引导到全部商品页。</p>
 */
@Service
public class SupportProductCatalog {

  private static final Pattern CJK_RUN = Pattern.compile("[\\u4e00-\\u9fff]+");
  private static final Pattern WORD = Pattern.compile("[a-z0-9]+");
  private static final Pattern PRODUCT_PATH =
      Pattern.compile("/zh/(?:midea/|toshiba/)?p/([^\\s/?#，。；、）)\\]]+)/?");
  private static final int MAX_CONTENT = 3600;
  private static final int FIELD_LIMIT = 220;
  private static final int MIN_SCORE = 40;

  private static final Set<String> CJK_STOP = Set.copyOf(List.of(
      "这个", "这款", "那款", "哪种", "那个", "多少", "少钱", "价格", "价钱", "售价",
      "有货", "现货", "库存", "请问", "你好", "谢谢", "推荐", "对比", "比较", "哪个",
      "什么", "怎么", "可以", "能不", "能买", "想买", "我要", "我们", "你们", "他们",
      "商品", "产品", "东西", "一下", "现在", "还有", "没有", "是否", "支持", "钱",
      "吗", "呢", "的", "了", "我", "你", "他", "她", "它", "们", "有", "货", "和",
      "与", "及", "或", "是", "在", "买", "要", "能", "会", "给", "帮", "查", "看",
      "说", "问", "这", "那", "哪", "个", "款", "种", "些", "吧", "啊", "呀", "哦",
      "麻烦", "需要", "想要", "知道", "了解", "怎么卖", "卖什么", "哪些", "有什么",
      "宝宝", "出生", "在家", "家里", "家中", "家用", "仪器", "设备", "机器", "使用",
      "适合", "人群", "老人", "孩子", "儿童", "成人", "患者", "买台", "买一台"));

  private static final Set<String> EN_STOP = Set.copyOf(List.of(
      "the", "a", "an", "is", "are", "do", "does", "you", "your", "i", "my", "me",
      "we", "our", "it", "this", "that", "these", "those", "of", "for", "to", "in",
      "on", "at", "and", "or", "with", "how", "what", "which", "can", "could",
      "would", "should", "please", "thanks", "thank", "much", "many", "price", "cost",
      "stock", "available", "have", "has", "any", "about", "tell", "know", "want",
      "need", "buy", "purchase", "product", "products", "item", "items", "model",
      "models", "spec", "specs", "feature", "features", "recommend", "compare",
      "difference", "between", "good", "best", "cheap", "cheapest", "latest", "new"));

  private static final List<String> CATALOG_INTENT = List.of(
      "有什么商品", "有哪些商品", "卖什么", "商品目录", "产品目录", "所有商品", "全部商品",
      "推荐", "选购", "挑选", "有什么产品", "有哪些产品", "想买", "买个", "买一台",
      "买一款", "有没有", "有吗", "哪款", "什么牌子", "家用", "仪器", "what do you sell",
      "product list", "catalog", "recommend", "do you have", "looking for");
  private static final List<String> FULL_LIST_TERMS = List.of(
      "所有商品", "全部商品", "商品清单", "商品列表", "所有产品", "全部产品",
      "all products", "full catalog", "product list", "list all", "catalog list");
  private static final List<String> STOCK_TERMS = List.of(
      "库存", "有货", "现货", "能买", "能下单", "stock", "available", "in stock");
  private static final List<String> DEVICE_INTENT_TERMS = List.of(
      "买", "购买", "推荐", "家用", "在家", "测", "监测", "老人", "宝宝", "孩子",
      "病人", "使用", "一台", "一款", "设备", "仪器", "选购",
      "buy", "purchase", "recommend", "monitor", "measure", "device", "home");
  private static final List<String> ACCESSORY_REQUEST_TERMS = List.of(
      "配件", "耗材", "替换", "备用", "电池", "袖带", "电源线", "试纸", "针头",
      "cable", "cuff", "strip", "lancet", "needle", "battery", "replacement", "accessory");
  private static final List<String> ACCESSORY_PRODUCT_TERMS = List.of(
      "配件", "耗材", "试纸", "针头", "袖带", "电源线", "电池", "电缆",
      "cable", "cuff", "strip", "lancet", "needle", "battery", "accessory", "consumable");

  private final DataStore dataStore;
  private final OmsSkuMappingService mappingService;
  private final OmsProductSyncService productSync;
  private final OmsChannel omsChannel;

  public SupportProductCatalog(
      DataStore dataStore,
      OmsSkuMappingService mappingService,
      OmsProductSyncService productSync,
      OmsChannel omsChannel) {
    this.dataStore = dataStore;
    this.mappingService = mappingService;
    this.productSync = productSync;
    this.omsChannel = omsChannel;
  }

  /** 结构化商品购买链接，供客服前端渲染商品卡片/购买按钮。 */
  public record ProductLink(
      String id, String name, String slug, BigDecimal price, String image, String url) {}

  /**
   * 从本轮回答中提取用户实际被推荐/提到的商品，生成购买链接。
   *
   * <p>只使用本轮签名证据中的商品，并以下列任一信号确认回答确实提到了该商品：
   * 商品页链接、完整商品名或回答中出现该商品价格。这样“没有黄疸仪”这类否定回答不会
   * 附带无关商品卡片。</p>
   */
  public List<ProductLink> linksFromAnswer(
      String answer, List<Map<String, String>> citations) {
    if (answer == null || answer.isBlank()) {
      return List.of();
    }
    String text = normalize(answer);
    LinkedHashMap<String, ProductLink> links = new LinkedHashMap<>();
    for (Map<String, String> citation : citations == null ? List.<Map<String, String>>of() : citations) {
      if (citation == null) {
        continue;
      }
      String reference = citation.get("reference");
      String id = catalogueProductId(reference);
      if (id == null) {
        continue;
      }
      Product product = dataStore.findProductById(id);
      if (product == null || product.id() == null) {
        continue;
      }
      if (mentionsProduct(text, product)) {
        links.putIfAbsent(product.id(), toLink(product));
      }
    }
    // Models sometimes quote a product page without citing it; honour those links too.
    Matcher matcher = PRODUCT_PATH.matcher(answer);
    while (matcher.find()) {
      Product product = dataStore.findProductBySlug(matcher.group(1));
      if (product != null && product.id() != null) {
        links.putIfAbsent(product.id(), toLink(product));
      }
    }
    return List.copyOf(links.values());
  }

  private boolean mentionsProduct(String normalisedAnswer, Product product) {
    String slug = normalize(product.slug());
    if (!slug.isEmpty()
        && (normalisedAnswer.contains("/zh/p/" + slug)
            || normalisedAnswer.contains(productPath(product)))) {
      return true;
    }
    String name = normalize(product.name());
    if (!name.isEmpty() && normalisedAnswer.contains(name)) {
      return true;
    }
    BigDecimal price = effectivePrice(product);
    if (price == null) {
      return false;
    }
    for (String variant : priceVariants(price)) {
      if (normalisedAnswer.contains("sgd " + variant)) {
        return true;
      }
    }
    return false;
  }

  private List<String> priceVariants(BigDecimal price) {
    String plain = price.setScale(2, RoundingMode.HALF_UP).toPlainString();
    String shortPlain = price.stripTrailingZeros().toPlainString();
    String grouped = String.format(Locale.ROOT, "%,.2f", price);
    String groupedShort = grouped.replace(".00", "");
    return List.of(plain, shortPlain, grouped, groupedShort);
  }

  private ProductLink toLink(Product product) {
    String slug = product.slug() == null ? "" : product.slug().trim();
    return new ProductLink(
        product.id(),
        product.name(),
        slug,
        effectivePrice(product),
        product.image(),
        productPath(product));
  }

  private BigDecimal effectivePrice(Product product) {
    boolean omsEnabled = omsChannel.isEnabled();
    if (product.id() != null && omsEnabled) {
      OmsSkuMapping mapping = mappingService.getByProductId(product.id());
      return effectivePrice(product, mapping, true);
    }
    return product.price();
  }

  private BigDecimal effectivePrice(
      Product product, OmsSkuMapping mapping, boolean omsEnabled) {
    if (omsEnabled && mapping != null && mapping.getSyncPrice() != null) {
      return mapping.getSyncPrice();
    }
    return product.price();
  }

  private static String catalogueProductId(String reference) {
    if (reference == null || !reference.startsWith("catalog://buzud/")) {
      return null;
    }
    String id = reference.substring("catalog://buzud/".length());
    if (id.isBlank() || id.equals("overview") || id.startsWith("index/")) {
      return null;
    }
    return id;
  }

  /**
   * 为一次客服请求挑选商品证据。最多返回 {@code limit} 条商品，必要时再追加一条类目概览。
   *
   * @param message 用户问题
   * @param productSlug 当前商品页 slug（可空）；用于回答“这个/这款”指代
   */
  public List<NovaSupportClient.Evidence> evidenceFor(String message, String productSlug, int limit) {
    String text = normalize(message);
    List<Product> products = dataStore.searchableProducts();
    Product context = findContextProduct(productSlug);
    if (products.isEmpty()) {
      return List.of();
    }

    Set<String> grams = cjkGrams(text);
    Set<String> words = englishWords(text);
    List<Scored> scored = new ArrayList<>();
    for (Product product : products) {
      int score = score(product, text, words, grams);
      if (context != null && context.id() != null && context.id().equals(product.id())) {
        score += 500;
      }
      if (score >= MIN_SCORE) {
        scored.add(new Scored(product, score));
      }
    }
    scored.sort(Comparator.comparingInt(Scored::score).reversed()
        .thenComparing(item -> item.product().name() == null ? "" : item.product().name()));

    List<Product> selected = scored.stream().limit(Math.max(1, limit)).map(Scored::product).toList();
    if (selected.isEmpty() && context != null) {
      selected = List.of(context);
    }
    boolean catalogIntent = matchesAny(text, CATALOG_INTENT);
    if (matchesAny(text, FULL_LIST_TERMS)) {
      // The user explicitly asked for the whole catalogue: provide a complete compact index
      // (split into <=3600-character evidence items). Prices and links are included so the
      // model can list or filter without receiving every product's long description.
      return List.copyOf(catalogueIndex(products, mappingsByProduct(), omsChannel.isEnabled()));
    }
    if (selected.isEmpty()) {
      if (!catalogIntent) {
        return List.of();
      }
      return List.of(overview(products));
    }

    Map<String, OmsSkuMapping> mappings = mappingsByProduct();
    boolean asksStock = matchesAny(text, STOCK_TERMS);
    List<NovaSupportClient.Evidence> evidence = new ArrayList<>();
    for (Product product : selected) {
      OmsSkuMapping mapping = product.id() == null ? null : mappings.get(product.id());
      evidence.add(toEvidence(product, mapping, asksStock));
    }
    if (catalogIntent && evidence.size() < Math.max(1, limit)) {
      evidence.add(overview(products));
    }
    return List.copyOf(evidence);
  }

  private Product findContextProduct(String productSlug) {
    if (productSlug == null || productSlug.isBlank()) {
      return null;
    }
    String slug = productSlug.trim();
    Product product = dataStore.findProductBySlug(slug);
    if (product == null) {
      try {
        product = dataStore.findProductBySlug(URLDecoder.decode(slug, StandardCharsets.UTF_8));
      } catch (IllegalArgumentException ignored) {
        // Keep the original lookup result; a malformed escape is not a server error.
      }
    }
    if (product == null) {
      product = dataStore.findProductById(slug);
    }
    return product;
  }

  private Map<String, OmsSkuMapping> mappingsByProduct() {
    Map<String, OmsSkuMapping> mappings = new HashMap<>();
    for (OmsSkuMapping mapping : mappingService.list()) {
      if (mapping.getProductId() != null) {
        mappings.put(mapping.getProductId(), mapping);
      }
    }
    return mappings;
  }

  private int score(Product product, String text, Set<String> words, Set<String> grams) {
    String name = normalize(product.name());
    String type = normalize(product.productType());
    String slug = normalize(product.slug());
    String design = normalize(product.designText());
    String semantic = normalize(semanticDetail(product.detail()));
    Set<String> categories = normalized(dataStore.categoryNamesFor(product.id()));
    Set<String> aliases = normalized(dataStore.aliasesFor(product.id()));

    int score = 0;
    if (!name.isEmpty() && text.contains(name)) {
      score += 500;
    }
    if (!slug.isEmpty() && text.contains(slug)) {
      score += 400;
    }
    for (String gram : grams) {
      int weight = 10 + 6 * (gram.length() - 2);
      if (name.contains(gram)) {
        score += weight * 3;
      }
      if (type.contains(gram)) {
        score += weight * 2;
      }
      if (design.contains(gram)) {
        score += weight;
      }
      if (slug.contains(gram)) {
        score += weight;
      }
      for (String category : categories) {
        if (category.contains(gram)) {
          score += weight * 2;
        }
      }
      for (String alias : aliases) {
        if (alias.contains(gram)) {
          score += weight * 2;
        }
      }
    }
    int semanticScore = 0;
    for (String gram : grams) {
      if (semantic.contains(gram)) {
        semanticScore = Math.max(semanticScore, 60 + 10 * (gram.length() - 2));
      }
    }
    for (String word : words) {
      if (containsWord(semantic, word)) {
        semanticScore = Math.max(semanticScore, 60);
      }
    }
    score += semanticScore;
    if (matchesAny(text, DEVICE_INTENT_TERMS)
        && !matchesAny(text, ACCESSORY_REQUEST_TERMS)
        && isAccessory(name, type)) {
      // A need like “想买个测血压的” should surface monitors, not cables, cuffs or strips.
      score -= 180;
    }
    for (String word : words) {
      if (containsWord(name, word)) {
        score += 70;
      }
      if (containsWord(type, word)) {
        score += 40;
      }
      if (containsWord(design, word)) {
        score += 20;
      }
      if (containsWord(slug, word)) {
        score += 30;
      }
      for (String category : categories) {
        if (containsWord(category, word)) {
          score += 40;
        }
      }
      for (String alias : aliases) {
        if (containsWord(alias, word)) {
          score += 40;
        }
      }
    }
    return score;
  }

  private NovaSupportClient.Evidence toEvidence(
      Product product, OmsSkuMapping mapping, boolean liveStock) {
    boolean omsEnabled = mapping != null && omsChannel.isEnabled();
    BigDecimal price = product.price();
    if (omsEnabled && mapping.getSyncPrice() != null) {
      price = mapping.getSyncPrice();
    }
    Integer stock = null;
    if (omsEnabled) {
      if (liveStock && mapping.getOmsSkuId() != null) {
        int live = productSync.availableStock(mapping.getOmsSkuId());
        if (live >= 0) {
          stock = live;
        }
      }
      if (stock == null && mapping.getSyncStock() != null) {
        stock = mapping.getSyncStock();
      }
    }

    String name = product.name() == null ? "未命名商品" : product.name().trim();
    StringBuilder content = new StringBuilder();
    content.append("商品：").append(name).append('\n');
    content.append("商品编号：").append(nullToEmpty(product.id())).append('\n');
    CategoryRef category = dataStore.findCategoryForProductId(product.id());
    if (category != null && category.name() != null && !category.name().isBlank()) {
      content.append("类目：").append(category.name()).append('\n');
    }
    if (price != null) {
      content.append("售价：SGD ").append(money(price)).append('\n');
    }
    if (product.originalPrice() != null && price != null
        && product.originalPrice().compareTo(price) > 0) {
      content.append("原价：SGD ").append(money(product.originalPrice())).append('\n');
    }
    appendLine(content, "类型", product.productType());
    appendLine(content, "规格", product.designText());
    JsonNode detail = product.detail();
    appendDetail(content, "商品说明", detail, "description");
    appendDetail(content, "产品特点", detail, "benefits");
    appendDetail(content, "适用人群", detail, "intendedFor");
    appendDetail(content, "使用方法", detail, "usage");
    appendDetail(content, "结果判读", detail, "resultReading");
    appendDetail(content, "注意事项", detail, "precautions");
    appendDetail(content, "包装内容", detail, "packageCount");
    appendDetail(content, "尺寸", detail, "dimension");
    appendDetail(content, "材质", detail, "materials");
    appendDetail(content, "护理", detail, "care");
    appendDetail(content, "储存方式", detail, "storage");
    appendDetail(content, "监管信息", detail, "hsaInfo");
    if (stock != null) {
      content.append("库存：可售库存 ").append(stock).append(" 件\n");
    } else {
      content.append("库存：未取得实时库存，请以商品页和结算结果为准\n");
    }
    String slug = product.slug() == null ? "" : product.slug().trim();
    content.append("商品页：").append(productPath(product)).append('\n');
    content.append("说明：价格和库存可能变动，最终以下单结算页为准。");

    LinkedHashSet<String> keywords = new LinkedHashSet<>();
    keywords.add("商品");
    keywords.add("产品");
    keywords.addAll(englishWords(normalize(name)));
    addNonBlank(keywords, product.productType());
    addNonBlank(keywords, product.designText());
    addNonBlank(keywords, slug);
    for (String categoryName : dataStore.categoryNamesFor(product.id())) {
      addNonBlank(keywords, categoryName);
    }
    for (String alias : dataStore.aliasesFor(product.id())) {
      addNonBlank(keywords, alias);
    }
    List<String> limitedKeywords = keywords.stream()
        .map(String::trim)
        .filter(value -> !value.isBlank())
        .limit(32)
        .toList();
    return new NovaSupportClient.Evidence(
        truncate(content.toString(), MAX_CONTENT),
        "商品资料",
        "catalog://buzud/" + nullToEmpty(product.id()),
        limitedKeywords);
  }

  private NovaSupportClient.Evidence overview(List<Product> products) {
    StringBuilder content = new StringBuilder();
    content.append("商品目录：本店共 ").append(products.size()).append(" 个商品，");
    List<CatalogCategory> categories = dataStore.catalogCategories();
    content.append(categories.size()).append(" 个类目。\n类目：");
    boolean first = true;
    int written = 0;
    for (CatalogCategory category : categories) {
      Set<String> ids = new HashSet<>();
      if (category.products() != null) {
        for (Product product : category.products()) {
          if (product.id() != null) {
            ids.add(product.id());
          }
        }
      }
      if (ids.isEmpty()) {
        continue;
      }
      if (!first) {
        content.append("；");
      }
      content.append(category.name()).append("（").append(ids.size()).append("）");
      first = false;
      written++;
      if (written >= 20 || content.length() > MAX_CONTENT - 300) {
        break;
      }
    }
    content.append("\n全部商品页：/zh/all-products/\n");
    content.append("可以按商品名称、型号或类目继续询问具体价格、规格、用法和库存。");
    return new NovaSupportClient.Evidence(
        truncate(content.toString(), MAX_CONTENT),
        "商品目录",
        "catalog://buzud/overview",
        List.of(
            "商品", "产品", "类目", "推荐", "目录", "有没有", "有吗", "想买", "买个",
            "买一台", "哪款", "家用", "仪器", "设备", "product", "catalog", "recommend"));
  }

  /** Complete catalogue index for explicit “list all products” questions. */
  private List<NovaSupportClient.Evidence> catalogueIndex(
      List<Product> products, Map<String, OmsSkuMapping> mappings, boolean omsEnabled) {
    List<String> lines = new ArrayList<>();
    for (Product product : products) {
      String name = product.name() == null ? "未命名商品" : product.name().trim();
      OmsSkuMapping mapping = product.id() == null ? null : mappings.get(product.id());
      BigDecimal effectivePrice = effectivePrice(product, mapping, omsEnabled);
      String price = effectivePrice == null ? "价格以商品页为准" : "SGD " + money(effectivePrice);
      String type = product.productType() == null ? "" : product.productType().trim();
      String slug = product.slug() == null ? "" : product.slug().trim();
      lines.add(
          name + "｜" + price + (type.isEmpty() ? "" : "｜" + type) + "｜" + productPath(product));
    }
    List<NovaSupportClient.Evidence> evidence = new ArrayList<>();
    StringBuilder chunk = new StringBuilder();
    int part = 1;
    for (String line : lines) {
      if (chunk.length() > 0 && chunk.length() + line.length() + 1 > 3300) {
        evidence.add(indexEvidence(part++, products.size(), chunk));
        chunk.setLength(0);
      }
      chunk.append(line).append('\n');
    }
    if (chunk.length() > 0) {
      evidence.add(indexEvidence(part, products.size(), chunk));
    }
    return evidence;
  }

  private NovaSupportClient.Evidence indexEvidence(
      int part, int total, StringBuilder lines) {
    String content = "商品清单（共 "
        + total
        + " 个商品，第 "
        + part
        + " 段）：价格为商品页标价，实时价格和库存以下单结算页为准。\n"
        + lines;
    return new NovaSupportClient.Evidence(
        truncate(content, MAX_CONTENT),
        "商品清单",
        "catalog://buzud/index/" + part,
        List.of("商品", "清单", "列表", "目录", "product", "catalog", "list"));
  }

  private static void appendLine(StringBuilder content, String label, String value) {
    if (value != null && !value.isBlank()) {
      content.append(label).append("：").append(truncate(value.trim(), FIELD_LIMIT)).append('\n');
    }
  }

  private static String productPath(Product product) {
    String slug = product.slug() == null ? "" : product.slug().trim();
    if (product.id() != null && product.id().startsWith("midea-")) {
      return "/zh/midea/p/" + slug + "/";
    }
    if (product.id() != null && product.id().startsWith("toshiba-")) {
      return "/zh/toshiba/p/" + slug + "/";
    }
    return "/zh/p/" + slug + "/";
  }

  private static void appendDetail(
      StringBuilder content, String label, JsonNode detail, String field) {
    if (detail == null || detail.isNull()) {
      return;
    }
    JsonNode value = detail.path(field);
    if (value.isTextual()) {
      appendLine(content, label, value.asText());
      return;
    }
    if (value.isArray()) {
      List<String> parts = new ArrayList<>();
      for (JsonNode item : value) {
        if (item.isTextual() && !item.asText().isBlank()) {
          parts.add(item.asText().trim());
        }
      }
      if (!parts.isEmpty()) {
        appendLine(content, label, String.join("；", parts));
      }
    }
  }

  private static String money(BigDecimal value) {
    return value.setScale(2, RoundingMode.HALF_UP).toPlainString();
  }

  private static String nullToEmpty(String value) {
    return value == null ? "" : value.trim();
  }

  private static String semanticDetail(JsonNode detail) {
    if (detail == null || detail.isNull()) {
      return "";
    }
    StringBuilder text = new StringBuilder();
    for (String field : List.of("intendedFor", "description", "benefits")) {
      JsonNode value = detail.path(field);
      if (value.isTextual()) {
        text.append(value.asText()).append(' ');
      } else if (value.isArray()) {
        for (JsonNode item : value) {
          if (item.isTextual()) {
            text.append(item.asText()).append(' ');
          }
        }
      }
    }
    return text.toString();
  }

  private static boolean isAccessory(String name, String type) {
    for (String term : ACCESSORY_PRODUCT_TERMS) {
      if (term.codePoints().allMatch(code -> code < 128)) {
        if (containsWord(name, term) || containsWord(type, term)) {
          return true;
        }
      } else if (name.contains(term) || type.contains(term)) {
        return true;
      }
    }
    return false;
  }

  private static boolean matchesAny(String text, List<String> terms) {
    for (String term : terms) {
      if (term.isBlank()) {
        continue;
      }
      if (term.codePoints().allMatch(code -> code < 128)) {
        if (containsWord(text, term.toLowerCase(Locale.ROOT))) {
          return true;
        }
      } else if (text.contains(term)) {
        return true;
      }
    }
    return false;
  }

  private static boolean containsWord(String haystack, String word) {
    if (haystack == null || haystack.isEmpty() || word == null || word.isEmpty()) {
      return false;
    }
    int index = haystack.indexOf(word);
    while (index >= 0) {
      boolean left = index == 0 || !Character.isLetterOrDigit(haystack.charAt(index - 1));
      int end = index + word.length();
      boolean right = end == haystack.length()
          || !Character.isLetterOrDigit(haystack.charAt(end));
      if (left && right) {
        return true;
      }
      index = haystack.indexOf(word, index + 1);
    }
    return false;
  }

  private static Set<String> normalized(Set<String> values) {
    Set<String> normalized = new HashSet<>();
    for (String value : values) {
      String text = normalize(value);
      if (!text.isBlank()) {
        normalized.add(text);
      }
    }
    return normalized;
  }

  private static Set<String> cjkGrams(String text) {
    LinkedHashSet<String> grams = new LinkedHashSet<>();
    Matcher matcher = CJK_RUN.matcher(text);
    while (matcher.find()) {
      String run = matcher.group();
      for (int length = Math.min(4, run.length()); length >= 2; length--) {
        for (int start = 0; start + length <= run.length(); start++) {
          String gram = run.substring(start, start + length);
          if (!CJK_STOP.contains(gram)) {
            grams.add(gram);
          }
          if (grams.size() >= 60) {
            return grams;
          }
        }
      }
    }
    return grams;
  }

  private static Set<String> englishWords(String text) {
    LinkedHashSet<String> words = new LinkedHashSet<>();
    Matcher matcher = WORD.matcher(text);
    while (matcher.find()) {
      String word = matcher.group();
      if (word.length() >= 2 && !EN_STOP.contains(word)) {
        words.add(word);
      }
      if (words.size() >= 30) {
        break;
      }
    }
    return words;
  }

  private static void addNonBlank(Set<String> values, String value) {
    if (value != null && !value.isBlank()) {
      values.add(value.trim());
    }
  }

  private static String truncate(String value, int limit) {
    return value.length() <= limit ? value : value.substring(0, limit - 1) + "…";
  }

  private static String normalize(String value) {
    if (value == null) {
      return "";
    }
    return Normalizer.normalize(value, Normalizer.Form.NFKC)
        .toLowerCase(Locale.ROOT)
        .trim();
  }

  private record Scored(Product product, int score) {}
}
