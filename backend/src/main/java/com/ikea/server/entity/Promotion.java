package com.ikea.server.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@TableName("promotion")
public class Promotion extends AuditEntity {

  private String code;
  private String name;
  private Integer type;
  private String productId;
  private BigDecimal discountValue;
  private LocalDateTime startAt;
  private LocalDateTime endAt;
  private Integer status;

  public String getCode() { return code; }
  public void setCode(String code) { this.code = code; }
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public Integer getType() { return type; }
  public void setType(Integer type) { this.type = type; }
  public String getProductId() { return productId; }
  public void setProductId(String productId) { this.productId = productId; }
  public BigDecimal getDiscountValue() { return discountValue; }
  public void setDiscountValue(BigDecimal discountValue) { this.discountValue = discountValue; }
  public LocalDateTime getStartAt() { return startAt; }
  public void setStartAt(LocalDateTime startAt) { this.startAt = startAt; }
  public LocalDateTime getEndAt() { return endAt; }
  public void setEndAt(LocalDateTime endAt) { this.endAt = endAt; }
  public Integer getStatus() { return status; }
  public void setStatus(Integer status) { this.status = status; }
}
