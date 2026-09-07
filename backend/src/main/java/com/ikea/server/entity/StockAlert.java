package com.ikea.server.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;

@TableName("stock_alert")
public class StockAlert extends AuditEntity {

  private Long userId;
  private String productId;
  private String contact;
  private Integer status;
  private LocalDateTime notifiedAt;

  public Long getUserId() { return userId; }
  public void setUserId(Long userId) { this.userId = userId; }
  public String getProductId() { return productId; }
  public void setProductId(String productId) { this.productId = productId; }
  public String getContact() { return contact; }
  public void setContact(String contact) { this.contact = contact; }
  public Integer getStatus() { return status; }
  public void setStatus(Integer status) { this.status = status; }
  public LocalDateTime getNotifiedAt() { return notifiedAt; }
  public void setNotifiedAt(LocalDateTime notifiedAt) { this.notifiedAt = notifiedAt; }
}
