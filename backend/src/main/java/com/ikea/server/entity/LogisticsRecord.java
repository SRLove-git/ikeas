package com.ikea.server.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;

@TableName("logistics_record")
public class LogisticsRecord {

  @TableId(type = IdType.ASSIGN_ID)
  private Long id;

  private String orderNo;
  private String carrier;
  private String trackingNo;
  private String status;
  private String traceInfo;

  @TableField(fill = FieldFill.INSERT)
  private LocalDateTime createdAt;

  @TableField(fill = FieldFill.INSERT_UPDATE)
  private LocalDateTime updatedAt;

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public String getOrderNo() { return orderNo; }
  public void setOrderNo(String orderNo) { this.orderNo = orderNo; }
  public String getCarrier() { return carrier; }
  public void setCarrier(String carrier) { this.carrier = carrier; }
  public String getTrackingNo() { return trackingNo; }
  public void setTrackingNo(String trackingNo) { this.trackingNo = trackingNo; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public String getTraceInfo() { return traceInfo; }
  public void setTraceInfo(String traceInfo) { this.traceInfo = traceInfo; }
  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
  public LocalDateTime getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
