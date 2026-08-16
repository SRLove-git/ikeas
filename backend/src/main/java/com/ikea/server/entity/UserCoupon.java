package com.ikea.server.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.Version;
import java.time.LocalDateTime;

@TableName("user_coupon")
public class UserCoupon {

  @TableId(type = IdType.ASSIGN_ID) private Long id;
  private Long userId;
  private Long couponId;
  private Integer status;
  private String usedOrderNo;
  @TableLogic private Integer deleted;
  @Version private Integer version;
  @TableField(fill = FieldFill.INSERT) private LocalDateTime createdAt;
  @TableField(fill = FieldFill.INSERT_UPDATE) private LocalDateTime updatedAt;

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public Long getUserId() { return userId; }
  public void setUserId(Long userId) { this.userId = userId; }
  public Long getCouponId() { return couponId; }
  public void setCouponId(Long couponId) { this.couponId = couponId; }
  public Integer getStatus() { return status; }
  public void setStatus(Integer status) { this.status = status; }
  public String getUsedOrderNo() { return usedOrderNo; }
  public void setUsedOrderNo(String usedOrderNo) { this.usedOrderNo = usedOrderNo; }
  public Integer getDeleted() { return deleted; }
  public void setDeleted(Integer deleted) { this.deleted = deleted; }
  public Integer getVersion() { return version; }
  public void setVersion(Integer version) { this.version = version; }
  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
  public LocalDateTime getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
