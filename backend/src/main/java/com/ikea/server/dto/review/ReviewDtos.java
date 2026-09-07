package com.ikea.server.dto.review;

import java.time.LocalDateTime;
import java.util.List;

public final class ReviewDtos {

  private ReviewDtos() {}

  public record ReviewRequest(
      String productId,
      String orderNo,
      Integer rating,
      String content,
      List<String> images) {}

  public record ReviewView(
      Long id,
      String productId,
      Long userId,
      String userName,
      Integer rating,
      String content,
      List<String> images,
      LocalDateTime createdAt) {}

  public record ProductReviews(
      String productId,
      double averageRating,
      long count,
      List<ReviewView> items) {}
}
