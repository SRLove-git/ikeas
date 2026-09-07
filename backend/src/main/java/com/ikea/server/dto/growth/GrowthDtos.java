package com.ikea.server.dto.growth;

import java.time.LocalDateTime;
import java.util.List;

public final class GrowthDtos {

  private GrowthDtos() {}

  public record ActivityProduct(String productId, String name, String label, String href) {}

  public record HotSearch(String keyword, String href) {}

  public record EventRequest(String eventType, String productId, String source) {}

  public record EventSummary(
      long totalEvents,
      long productViews,
      long cartAdds,
      long orders,
      List<TopProduct> topProducts) {}

  public record TopProduct(String productId, long count) {}

  public record PromotionView(
      Long id,
      String code,
      String name,
      Integer type,
      String productId,
      java.math.BigDecimal discountValue,
      LocalDateTime startAt,
      LocalDateTime endAt,
      Integer status) {}

  public record PromotionRequest(
      String code,
      String name,
      Integer type,
      String productId,
      java.math.BigDecimal discountValue,
      LocalDateTime startAt,
      LocalDateTime endAt) {}
}
