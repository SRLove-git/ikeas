package com.ikea.server.web;

import com.ikea.server.constant.SecurityConstants;
import com.ikea.server.dto.review.ReviewDtos.ProductReviews;
import com.ikea.server.dto.review.ReviewDtos.ReviewRequest;
import com.ikea.server.dto.review.ReviewDtos.ReviewView;
import com.ikea.server.service.ReviewService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reviews")
public class ReviewController {

  private final ReviewService reviewService;

  public ReviewController(ReviewService reviewService) {
    this.reviewService = reviewService;
  }

  @GetMapping("/{productId}")
  public ProductReviews list(@PathVariable String productId) {
    return reviewService.list(productId);
  }

  @PostMapping
  public ReviewView create(@RequestBody ReviewRequest body, HttpServletRequest request) {
    return reviewService.create(userId(request), body);
  }

  private static Long userId(HttpServletRequest request) {
    String value = (String) request.getAttribute(SecurityConstants.USER_ID_ATTRIBUTE);
    if (value == null) {
      throw new UnauthorizedException("请先登录");
    }
    return Long.valueOf(value);
  }
}
