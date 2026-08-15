package com.ikea.server.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.Version;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/** OMS 商品映射（数据库表 oms_sku_mapping）：BUZUD productId ↔ OMS skuId。 */
@TableName("oms_sku_mapping")
public class OmsSkuMapping {

  @TableId(type = IdType.ASSIGN_ID)
  private Long id;

  private String productId;
  private Long omsSkuId;
  private String omsSkuNo;
  private BigDecimal syncPrice;
  private Integer syncStock;
  private LocalDateTime lastSyncAt;

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

  public String getProductId() {
    return productId;
  }

  public void setProductId(String productId) {
    this.productId = productId;
  }

  public Long getOmsSkuId() {
    return omsSkuId;
  }

  public void setOmsSkuId(Long omsSkuId) {
    this.omsSkuId = omsSkuId;
  }

  public String getOmsSkuNo() {
    return omsSkuNo;
  }

  public void setOmsSkuNo(String omsSkuNo) {
    this.omsSkuNo = omsSkuNo;
  }

  public BigDecimal getSyncPrice() {
    return syncPrice;
  }

  public void setSyncPrice(BigDecimal syncPrice) {
    this.syncPrice = syncPrice;
  }

  public Integer getSyncStock() {
    return syncStock;
  }

  public void setSyncStock(Integer syncStock) {
    this.syncStock = syncStock;
  }

  public LocalDateTime getLastSyncAt() {
    return lastSyncAt;
  }

  public void setLastSyncAt(LocalDateTime lastSyncAt) {
    this.lastSyncAt = lastSyncAt;
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
