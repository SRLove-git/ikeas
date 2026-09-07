package com.ikea.server.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.ikea.server.data.DataStore;
import com.ikea.server.dto.growth.GrowthDtos.ActivityProduct;
import com.ikea.server.dto.growth.GrowthDtos.EventRequest;
import com.ikea.server.dto.growth.GrowthDtos.EventSummary;
import com.ikea.server.dto.growth.GrowthDtos.HotSearch;
import com.ikea.server.dto.growth.GrowthDtos.PromotionRequest;
import com.ikea.server.dto.growth.GrowthDtos.PromotionView;
import com.ikea.server.dto.growth.GrowthDtos.TopProduct;
import com.ikea.server.entity.Promotion;
import com.ikea.server.entity.UserEvent;
import com.ikea.server.mapper.PromotionMapper;
import com.ikea.server.mapper.UserEventMapper;
import com.ikea.server.model.Product;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GrowthService {

  private final DataStore dataStore;
  private final PromotionMapper promotionMapper;
  private final UserEventMapper eventMapper;

  public GrowthService(
      DataStore dataStore, PromotionMapper promotionMapper, UserEventMapper eventMapper) {
    this.dataStore = dataStore;
    this.promotionMapper = promotionMapper;
    this.eventMapper = eventMapper;
  }

  public List<ActivityProduct> activities() {
    List<ActivityProduct> result = new ArrayList<>();
    for (Product product : dataStore.allProducts()) {
      if (product.labels() != null) {
        for (var label : product.labels()) {
          String text = label.path("text").asText(null);
          if (text != null && !text.isBlank()) {
            result.add(new ActivityProduct(
                product.id(), product.name(), text, "/zh/p/" + product.slug() + "/"));
          }
        }
      }
    }
    return result;
  }

  public List<HotSearch> hotSearches() {
    return List.of(
        new HotSearch("血糖仪", "/zh/search/products?q=血糖"),
        new HotSearch("血压计", "/zh/search/products?q=血压"),
        new HotSearch("CGM", "/zh/search/products?q=CGM"),
        new HotSearch("血氧仪", "/zh/search/products?q=血氧"),
        new HotSearch("制氧机", "/zh/search/products?q=制氧"));
  }

  public List<Product> recommendations(String productId, int limit) {
    Product current = productId == null ? null : dataStore.findProductById(productId);
    int safeLimit = Math.max(1, Math.min(limit, 20));
    if (current == null || current.productType() == null) {
      return dataStore.allProducts().stream().limit(safeLimit).toList();
    }
    return dataStore.allProducts().stream()
        .filter(product -> !product.id().equals(current.id()))
        .filter(product -> current.productType().equals(product.productType()))
        .limit(safeLimit)
        .toList();
  }

  @Transactional
  public void recordEvent(Long userId, EventRequest request) {
    if (request == null || request.eventType() == null || request.eventType().isBlank()) {
      throw new IllegalArgumentException("eventType 不能为空");
    }
    UserEvent event = new UserEvent();
    event.setUserId(userId);
    event.setEventType(request.eventType());
    event.setProductId(request.productId());
    event.setSource(request.source());
    eventMapper.insert(event);
  }

  public EventSummary summary() {
    List<UserEvent> events = eventMapper.selectList(null);
    long total = events.size();
    long views = events.stream().filter(e -> "product_view".equals(e.getEventType())).count();
    long cartAdds = events.stream().filter(e -> "cart_add".equals(e.getEventType())).count();
    long orders = events.stream().filter(e -> "order_create".equals(e.getEventType())).count();
    Map<String, Long> top = events.stream()
        .filter(e -> e.getProductId() != null)
        .collect(Collectors.groupingBy(UserEvent::getProductId, Collectors.counting()));
    List<TopProduct> topProducts = top.entrySet().stream()
        .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
        .limit(10)
        .map(entry -> new TopProduct(entry.getKey(), entry.getValue()))
        .toList();
    return new EventSummary(total, views, cartAdds, orders, topProducts);
  }

  public List<PromotionView> promotions() {
    return promotionMapper.selectList(
            Wrappers.lambdaQuery(Promotion.class).eq(Promotion::getStatus, 1).orderByDesc(Promotion::getId))
        .stream().map(this::toView).toList();
  }

  @Transactional
  public PromotionView createPromotion(PromotionRequest request) {
    if (request.code() == null || request.name() == null) {
      throw new IllegalArgumentException("code 和 name 必填");
    }
    Promotion promotion = new Promotion();
    promotion.setCode(request.code());
    promotion.setName(request.name());
    promotion.setType(request.type() == null ? 1 : request.type());
    promotion.setProductId(request.productId());
    promotion.setDiscountValue(request.discountValue());
    promotion.setStartAt(request.startAt());
    promotion.setEndAt(request.endAt());
    promotion.setStatus(1);
    promotionMapper.insert(promotion);
    return toView(promotion);
  }

  private PromotionView toView(Promotion promotion) {
    return new PromotionView(
        promotion.getId(),
        promotion.getCode(),
        promotion.getName(),
        promotion.getType(),
        promotion.getProductId(),
        promotion.getDiscountValue(),
        promotion.getStartAt(),
        promotion.getEndAt(),
        promotion.getStatus());
  }
}
