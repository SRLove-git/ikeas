package com.ikea.server.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.Version;
import java.time.LocalDateTime;

/** OMS 订单映射（数据库表 oms_order_mapping）：BUZUD orderNo ↔ OMS 订单号与同步状态。 */
@TableName("oms_order_mapping")
public class OmsOrderMapping {

  @TableId(type = IdType.ASSIGN_ID)
  private Long id;

  private String orderNo;
  private String externalOrderNo;
  private String omsOrderNo;
  private Integer omsStatus;
  private Integer syncStatus;
  private String lastError;
  private Integer retryCount;
  private LocalDateTime nextRetryAt;

  @TableLogic
  private Integer deleted;

  @Version
  private Integer version;

  @TableField(fill = FieldFill.INSERT)
  private LocalDateTime createdAt;

  @TableField(fill = FieldFill.INSERT_UPDATE)
  private LocalDateTime updatedAt;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getOrderNo() {
    return orderNo;
  }

  public void setOrderNo(String orderNo) {
    this.orderNo = orderNo;
  }

  public String getExternalOrderNo() {
    return externalOrderNo;
  }

  public void setExternalOrderNo(String externalOrderNo) {
    this.externalOrderNo = externalOrderNo;
  }

  public String getOmsOrderNo() {
    return omsOrderNo;
  }

  public void setOmsOrderNo(String omsOrderNo) {
    this.omsOrderNo = omsOrderNo;
  }

  public Integer getOmsStatus() {
    return omsStatus;
  }

  public void setOmsStatus(Integer omsStatus) {
    this.omsStatus = omsStatus;
  }

  public Integer getSyncStatus() {
    return syncStatus;
  }

  public void setSyncStatus(Integer syncStatus) {
    this.syncStatus = syncStatus;
  }

  public String getLastError() {
    return lastError;
  }

  public void setLastError(String lastError) {
    this.lastError = lastError;
  }

  public Integer getRetryCount() {
    return retryCount;
  }

  public void setRetryCount(Integer retryCount) {
    this.retryCount = retryCount;
  }

  public LocalDateTime getNextRetryAt() {
    return nextRetryAt;
  }

  public void setNextRetryAt(LocalDateTime nextRetryAt) {
    this.nextRetryAt = nextRetryAt;
  }

  public Integer getDeleted() {
    return deleted;
  }

  public void setDeleted(Integer deleted) {
    this.deleted = deleted;
  }

  public Integer getVersion() {
    return version;
  }

  public void setVersion(Integer version) {
    this.version = version;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(LocalDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }
}
