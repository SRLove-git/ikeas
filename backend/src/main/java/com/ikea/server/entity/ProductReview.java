package com.ikea.server.entity;

import com.baomidou.mybatisplus.annotation.TableName;

@TableName("product_review")
public class ProductReview extends AuditEntity {

  private String productId;
  private Long userId;
  private String orderNo;
  private Integer rating;
  private String content;
  private String images;
  private Integer status;

  public String getProductId() { return productId; }
  public void setProductId(String productId) { this.productId = productId; }
  public Long getUserId() { return userId; }
  public void setUserId(Long userId) { this.userId = userId; }
  public String getOrderNo() { return orderNo; }
  public void setOrderNo(String orderNo) { this.orderNo = orderNo; }
  public Integer getRating() { return rating; }
  public void setRating(Integer rating) { this.rating = rating; }
  public String getContent() { return content; }
  public void setContent(String content) { this.content = content; }
  public String getImages() { return images; }
  public void setImages(String images) { this.images = images; }
  public Integer getStatus() { return status; }
  public void setStatus(Integer status) { this.status = status; }
}
