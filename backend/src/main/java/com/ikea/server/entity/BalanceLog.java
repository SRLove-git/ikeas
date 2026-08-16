package com.ikea.server.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@TableName("balance_log")
public class BalanceLog {
  @TableId(type = IdType.ASSIGN_ID) private Long id;
  private Long userId;
  private BigDecimal changeAmount;
  private String type;
  private String remark;
  @TableField(fill = FieldFill.INSERT) private LocalDateTime createdAt;

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public Long getUserId() { return userId; }
  public void setUserId(Long userId) { this.userId = userId; }
  public BigDecimal getChangeAmount() { return changeAmount; }
  public void setChangeAmount(BigDecimal changeAmount) { this.changeAmount = changeAmount; }
  public String getType() { return type; }
  public void setType(String type) { this.type = type; }
  public String getRemark() { return remark; }
  public void setRemark(String remark) { this.remark = remark; }
  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
