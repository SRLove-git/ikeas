package com.ikea.server.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ikea.server.data.DataStore;
import com.ikea.server.entity.OmsSkuMapping;
import com.ikea.server.integration.oms.OmsChannel;
import com.ikea.server.integration.oms.OmsProductSyncService;
import com.ikea.server.integration.oms.OmsSkuMappingService;
import com.ikea.server.model.CatalogCategory;
import com.ikea.server.model.CategoryRef;
import com.ikea.server.model.Product;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;

class SupportProductCatalogTest {
  private static final String SLUG = "hcg-pregnancy-rapid-test-8885020710595";
  private final DataStore dataStore = mock(DataStore.class);
  private final OmsSkuMappingService mappings = mock(OmsSkuMappingService.class);
  private final OmsProductSyncService productSync = mock(OmsProductSyncService.class);
  private final OmsChannel omsChannel = mock(OmsChannel.class);
  private final SupportProductCatalog catalog =
      new SupportProductCatalog(dataStore, mappings, productSync, omsChannel);
  private final ObjectMapper mapper = new ObjectMapper();

  private Product product() throws Exception {
    JsonNode detail = mapper.readTree("""
        {"intendedFor":"需要居家快速检测的人群",
         "usage":"请按随附说明书完成取样与检测",
         "precautions":"仅供自测使用，请勿重复使用",
         "packageCount":"包装内含检测试剂，数量以实物包装为准"}
        """);
    return new Product(
        "8885020710595",
        SLUG,
        "HCG Pregnancy Rapid Test",
        "早孕检测",
        null,
        new BigDecimal("9.90"),
        null,
        "https://example.test/hcg.png",
        List.of(),
        detail,
        List.of("早孕检测"));
  }

  private void index(Product product) {
    when(dataStore.searchableProducts()).thenReturn(List.of(product));
    when(dataStore.categoryNamesFor(product.id())).thenReturn(Set.of("早孕检测"));
    when(dataStore.aliasesFor(product.id())).thenReturn(Set.of());
    when(dataStore.findCategoryForProductId(product.id()))
        .thenReturn(new CategoryRef("早孕检测", "/zh/cat/zaoyun"));
    when(dataStore.findProductById(product.id())).thenReturn(product);
    when(dataStore.findProductBySlug(product.slug())).thenReturn(product);
  }

  @Test
  void matchesChineseCategoryWordingAndIncludesCatalogueFacts() throws Exception {
    Product product = product();
    index(product);
    when(mappings.list()).thenReturn(List.of());

    List<NovaSupportClient.Evidence> evidence = catalog.evidenceFor("早孕检测试纸多少钱？", null, 6);

    assertFalse(evidence.isEmpty());
    String content = evidence.getFirst().content();
    assertTrue(content.contains("商品：HCG Pregnancy Rapid Test"));
    assertTrue(content.contains("售价：SGD 9.90"));
    assertTrue(content.contains("适用人群：需要居家快速检测的人群"));
    assertTrue(content.contains("商品页：/zh/p/" + SLUG + "/"));
    assertEquals("catalog://buzud/8885020710595", evidence.getFirst().reference());
    assertEquals("商品资料", evidence.getFirst().title());
  }

  @Test
  void productPageContextResolvesThisProductEvenWithoutAName() throws Exception {
    Product product = product();
    index(product);
    when(dataStore.findProductBySlug(SLUG)).thenReturn(product);
    when(mappings.list()).thenReturn(List.of());

    List<NovaSupportClient.Evidence> evidence = catalog.evidenceFor("这个多少钱", SLUG, 6);

    assertEquals(1, evidence.size());
    assertTrue(evidence.getFirst().content().contains("售价：SGD 9.90"));
  }

  @Test
  void omsPriceAndLiveStockOverrideCatalogueSnapshot() throws Exception {
    Product product = product();
    index(product);
    when(dataStore.findProductBySlug(SLUG)).thenReturn(product);
    OmsSkuMapping mapping = new OmsSkuMapping();
    mapping.setProductId(product.id());
    mapping.setOmsSkuId(7L);
    mapping.setSyncPrice(new BigDecimal("18.50"));
    mapping.setSyncStock(4);
    when(omsChannel.isEnabled()).thenReturn(true);
    when(mappings.list()).thenReturn(List.of(mapping));
    when(productSync.availableStock(7L)).thenReturn(3);

    List<NovaSupportClient.Evidence> evidence = catalog.evidenceFor("这个有货吗", SLUG, 6);

    String content = evidence.getFirst().content();
    assertTrue(content.contains("售价：SGD 18.50"));
    assertTrue(content.contains("库存：可售库存 3 件"));
    verify(productSync).availableStock(7L);
  }

  @Test
  void stockQuestionsRefreshEverySelectedOmsProduct() throws Exception {
    Product first = product();
    Product second = new Product(
        "8885020710596",
        "hcg-pregnancy-test-plus-8885020710596",
        "HCG Pregnancy Test Plus",
        "早孕检测",
        null,
        new BigDecimal("12.90"),
        null,
        "https://example.test/hcg-plus.png",
        List.of(),
        mapper.readTree("{}"),
        List.of("早孕检测"));
    when(dataStore.searchableProducts()).thenReturn(List.of(first, second));
    for (Product item : List.of(first, second)) {
      when(dataStore.categoryNamesFor(item.id())).thenReturn(Set.of("早孕检测"));
      when(dataStore.aliasesFor(item.id())).thenReturn(Set.of());
    }
    OmsSkuMapping firstMapping = new OmsSkuMapping();
    firstMapping.setProductId(first.id());
    firstMapping.setOmsSkuId(7L);
    firstMapping.setSyncStock(9);
    OmsSkuMapping secondMapping = new OmsSkuMapping();
    secondMapping.setProductId(second.id());
    secondMapping.setOmsSkuId(8L);
    secondMapping.setSyncStock(9);
    when(omsChannel.isEnabled()).thenReturn(true);
    when(mappings.list()).thenReturn(List.of(firstMapping, secondMapping));
    when(productSync.availableStock(7L)).thenReturn(3);
    when(productSync.availableStock(8L)).thenReturn(5);

    List<NovaSupportClient.Evidence> evidence = catalog.evidenceFor("HCG stock", null, 6);

    assertEquals(2, evidence.size());
    assertTrue(evidence.stream().anyMatch(item -> item.content().contains("可售库存 3 件")));
    assertTrue(evidence.stream().anyMatch(item -> item.content().contains("可售库存 5 件")));
    verify(productSync).availableStock(7L);
    verify(productSync).availableStock(8L);
  }

  @Test
  void unknownStockNeverClaimsAvailability() throws Exception {
    Product product = product();
    index(product);
    when(dataStore.findProductBySlug(SLUG)).thenReturn(product);
    when(mappings.list()).thenReturn(List.of());

    String content = catalog.evidenceFor("这个有货吗", SLUG, 6).getFirst().content();

    assertTrue(content.contains("未取得实时库存"));
    assertFalse(content.contains("库存：可售"));
  }

  @Test
  void catalogueListingReturnsCategoryOverview() throws Exception {
    Product product = product();
    index(product);
    when(dataStore.catalogCategories()).thenReturn(List.of(new CatalogCategory(
        "zaoyun", "早孕检测", "zaoyun", "/zh/cat/zaoyun", null, List.of(), List.of(product))));

    List<NovaSupportClient.Evidence> evidence = catalog.evidenceFor("你们卖什么商品", null, 6);

    assertEquals("catalog://buzud/overview", evidence.getFirst().reference());
    String content = evidence.getFirst().content();
    assertTrue(content.contains("商品目录"));
    assertTrue(content.contains("早孕检测（1）"));
    assertTrue(content.contains("全部商品页：/zh/all-products/"));
  }

  @Test
  void chineseGlucoseNeedSurfacesEnglishMeterThroughSemanticDetail() throws Exception {
    Product meter = new Product(
        "8885020710885",
        "buzud-safe-aq-ug-blood-glucose-monitoring-system-set-8885020710885",
        "BUZUD Safe AQ UG Blood Glucose Monitoring System Set",
        "血液分析仪",
        null,
        new BigDecimal("68.00"),
        null,
        "https://example.test/meter.png",
        List.of(),
        mapper.readTree("{\"intendedFor\":\"适合居家监测血糖、尿酸等指标的人群\"}"),
        List.of("血液分析仪"));
    when(dataStore.searchableProducts()).thenReturn(List.of(meter));
    when(dataStore.categoryNamesFor(meter.id())).thenReturn(Set.of("血液分析仪"));
    when(dataStore.aliasesFor(meter.id())).thenReturn(Set.of());
    when(mappings.list()).thenReturn(List.of());

    List<NovaSupportClient.Evidence> evidence =
        catalog.evidenceFor("最近血糖有点高，想买个测血糖的", null, 6);

    assertFalse(evidence.isEmpty());
    assertTrue(evidence.getFirst().content().contains("Blood Glucose Monitoring System"));
  }

  @Test
  void deviceNeedRanksMonitorsAboveAccessories() throws Exception {
    Product monitor = new Product(
        "8885020711097",
        "buzud-blood-pressure-monitor-30s-8885020711097",
        "BUZUD Blood Pressure Monitor 30S",
        "血压计",
        null,
        new BigDecimal("78.00"),
        null,
        "https://example.test/bp.png",
        List.of(),
        mapper.readTree("{}"),
        List.of("血压计"));
    Product cable = new Product(
        "8885020710151-1",
        "buzud-blood-pressure-monitor-power-cable-8885020710151-1",
        "BUZUD Blood Pressure Monitor Power Cable",
        "血压计配件",
        null,
        new BigDecimal("15.00"),
        null,
        "https://example.test/cable.png",
        List.of(),
        mapper.readTree("{}"),
        List.of("血压计"));
    when(dataStore.searchableProducts()).thenReturn(List.of(cable, monitor));
    for (Product product : List.of(monitor, cable)) {
      when(dataStore.categoryNamesFor(product.id())).thenReturn(Set.of("血压计"));
      when(dataStore.aliasesFor(product.id())).thenReturn(Set.of());
    }
    when(mappings.list()).thenReturn(List.of());

    List<NovaSupportClient.Evidence> evidence =
        catalog.evidenceFor("家里老人血压高，想买个在家测血压的", null, 6);

    assertFalse(evidence.isEmpty());
    assertTrue(evidence.getFirst().content().contains("Blood Pressure Monitor 30S"));
  }

  @Test
  void linksFromAnswerKeepsLinkedAndPricedProducts() throws Exception {
    Product product = product();
    index(product);
    List<Map<String, String>> citations = List.of(
        Map.of("title", "商品资料", "reference", "catalog://buzud/8885020710595"),
        Map.of("title", "商品目录", "reference", "catalog://buzud/overview"));

    List<SupportProductCatalog.ProductLink> linked =
        catalog.linksFromAnswer("可以看这款：/zh/p/" + SLUG + "/", citations);
    List<SupportProductCatalog.ProductLink> priced =
        catalog.linksFromAnswer("这款 SGD 9.90。", citations);
    List<SupportProductCatalog.ProductLink> unrelated =
        catalog.linksFromAnswer("目前没有测黄疸的仪器。", citations);
    List<SupportProductCatalog.ProductLink> withoutCitations =
        catalog.linksFromAnswer("欢迎咨询。", null);

    assertEquals(1, linked.size());
    assertEquals("8885020710595", linked.getFirst().id());
    assertEquals("/zh/p/" + SLUG + "/", linked.getFirst().url());
    assertEquals(new BigDecimal("9.90"), linked.getFirst().price());
    assertEquals(1, priced.size());
    assertTrue(unrelated.isEmpty());
    assertTrue(withoutCitations.isEmpty());
  }

  @Test
  void explicitFullListReturnsCompleteCatalogueIndex() throws Exception {
    Product product = product();
    index(product);
    Product second = new Product(
        "8885020710596",
        "blood-pressure-monitor-8885020710596",
        "BUZUD Blood Pressure Monitor",
        "血压计",
        null,
        new BigDecimal("99.00"),
        null,
        "https://example.test/bp.png",
        List.of(),
        mapper.readTree("{}"),
        List.of("血压计"));
    when(dataStore.searchableProducts()).thenReturn(List.of(product, second));
    when(dataStore.categoryNamesFor(second.id())).thenReturn(Set.of("血压计"));
    when(dataStore.aliasesFor(second.id())).thenReturn(Set.of());
    OmsSkuMapping mapping = new OmsSkuMapping();
    mapping.setProductId(product.id());
    mapping.setSyncPrice(new BigDecimal("18.50"));
    when(omsChannel.isEnabled()).thenReturn(true);
    when(mappings.list()).thenReturn(List.of(mapping));

    List<NovaSupportClient.Evidence> evidence = catalog.evidenceFor("列出所有商品", null, 6);

    assertFalse(evidence.isEmpty());
    assertEquals("catalog://buzud/index/1", evidence.getFirst().reference());
    String content = evidence.getFirst().content();
    assertTrue(content.contains("商品清单"));
    assertTrue(content.contains("HCG Pregnancy Rapid Test"));
    assertTrue(content.contains("BUZUD Blood Pressure Monitor"));
    assertTrue(content.contains("/zh/p/" + SLUG + "/"));
    assertTrue(content.contains("SGD 99.00"));
    assertTrue(content.contains("HCG Pregnancy Rapid Test｜SGD 18.50"));
    assertFalse(content.contains("HCG Pregnancy Rapid Test｜SGD 9.90"));
  }

  @Test
  void unsupportedNeedReturnsOverviewInsteadOfInventingAProduct() throws Exception {
    Product product = product();
    index(product);
    when(dataStore.catalogCategories()).thenReturn(List.of(new CatalogCategory(
        "zaoyun", "早孕检测", "zaoyun", "/zh/cat/zaoyun", null, List.of(), List.of(product))));

    List<NovaSupportClient.Evidence> evidence =
        catalog.evidenceFor("宝宝刚出生，想买个在家测黄疸的仪器，有吗？", null, 6);

    assertEquals(1, evidence.size());
    assertEquals("catalog://buzud/overview", evidence.getFirst().reference());
    assertTrue(evidence.getFirst().content().contains("全部商品页：/zh/all-products/"));
  }

  @Test
  void unrelatedQuestionDoesNotInjectProductEvidence() throws Exception {
    Product product = product();
    index(product);

    assertTrue(catalog.evidenceFor("怎么联系你们", null, 6).isEmpty());
  }
}
