package com.ikea.server.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ikea.server.data.DataStore;
import com.ikea.server.dto.review.ReviewDtos.ProductReviews;
import com.ikea.server.dto.review.ReviewDtos.ReviewRequest;
import com.ikea.server.dto.review.ReviewDtos.ReviewView;
import com.ikea.server.entity.AppUser;
import com.ikea.server.entity.ProductReview;
import com.ikea.server.mapper.ProductReviewMapper;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReviewService {

  private final ProductReviewMapper reviewMapper;
  private final DataStore dataStore;
  private final UserService userService;
  private final ObjectMapper objectMapper;

  public ReviewService(
      ProductReviewMapper reviewMapper,
      DataStore dataStore,
      UserService userService,
      ObjectMapper objectMapper) {
    this.reviewMapper = reviewMapper;
    this.dataStore = dataStore;
    this.userService = userService;
    this.objectMapper = objectMapper;
  }

  public ProductReviews list(String productId) {
    List<ProductReview> reviews = reviewMapper.selectList(
        Wrappers.lambdaQuery(ProductReview.class)
            .eq(ProductReview::getProductId, productId)
            .eq(ProductReview::getStatus, 1)
            .orderByDesc(ProductReview::getId)
            .last("LIMIT 50"));
    double avg = reviews.stream()
        .mapToInt(r -> r.getRating() == null ? 5 : r.getRating())
        .average()
        .orElse(0);
    return new ProductReviews(
        productId, Math.round(avg * 10.0) / 10.0, reviews.size(), reviews.stream().map(this::toView).toList());
  }

  @Transactional
  public ReviewView create(Long userId, ReviewRequest request) {
    if (request.productId() == null || dataStore.findProductById(request.productId()) == null) {
      throw new IllegalArgumentException("商品不存在");
    }
    int rating = request.rating() == null ? 5 : request.rating();
    if (rating < 1 || rating > 5) {
      throw new IllegalArgumentException("评分必须在 1-5 之间");
    }
    if (request.content() == null || request.content().isBlank()) {
      throw new IllegalArgumentException("评价内容不能为空");
    }
    ProductReview review = new ProductReview();
    review.setProductId(request.productId());
    review.setUserId(userId);
    review.setOrderNo(request.orderNo());
    review.setRating(rating);
    review.setContent(request.content().trim());
    review.setImages(writeImages(request.images()));
    review.setStatus(1);
    reviewMapper.insert(review);
    return toView(review);
  }

  private ReviewView toView(ProductReview review) {
    AppUser user = userService.findById(review.getUserId()).orElse(null);
    String userName = user == null
        ? "用户" + (review.getUserId() == null ? "" : review.getUserId())
        : user.getUsername() == null || user.getUsername().isBlank() ? user.getPhone() : user.getUsername();
    return new ReviewView(
        review.getId(),
        review.getProductId(),
        review.getUserId(),
        userName,
        review.getRating(),
        review.getContent(),
        readImages(review.getImages()),
        review.getCreatedAt());
  }

  private String writeImages(List<String> images) {
    try {
      return objectMapper.writeValueAsString(images == null ? List.of() : images);
    } catch (Exception ex) {
      return "[]";
    }
  }

  private List<String> readImages(String json) {
    try {
      return objectMapper.readValue(json == null ? "[]" : json, new TypeReference<List<String>>() {});
    } catch (Exception ex) {
      return new ArrayList<>();
    }
  }
}
