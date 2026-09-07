package com.ikea.server.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;

@TableName("user_event")
public class UserEvent {

  @TableId(type = IdType.ASSIGN_ID)
  private Long id;
  private Long userId;
  private String eventType;
  private String productId;
  private String source;

  @TableField(fill = FieldFill.INSERT)
  private LocalDateTime createdAt;

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public Long getUserId() { return userId; }
  public void setUserId(Long userId) { this.userId = userId; }
  public String getEventType() { return eventType; }
  public void setEventType(String eventType) { this.eventType = eventType; }
  public String getProductId() { return productId; }
  public void setProductId(String productId) { this.productId = productId; }
  public String getSource() { return source; }
  public void setSource(String source) { this.source = source; }
  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
