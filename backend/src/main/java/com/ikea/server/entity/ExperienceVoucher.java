package com.ikea.server.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.Version;
import java.time.LocalDateTime;

/** 线下印刷的实体体验券/积分券。类型：1=体验券，2=积分券；状态：0=未使用，1=已使用，2=停用，3=已作废。 */
@TableName("experience_voucher")
public class ExperienceVoucher {

  @TableId(type = IdType.ASSIGN_ID)
  private Long id;
  private String code;
  private Integer type;
  private Integer status;
  private LocalDateTime validUntil;
  private Long userId;
  private String orderNo;
  private String batchNo;
  private String qrContent;
  private String usedBookingId;
  private LocalDateTime usedAt;
  private String remark;
  @TableLogic private Integer deleted;
  @Version private Integer version;
  @TableField(fill = FieldFill.INSERT) private LocalDateTime createdAt;
  @TableField(fill = FieldFill.INSERT_UPDATE) private LocalDateTime updatedAt;

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public String getCode() { return code; }
  public void setCode(String code) { this.code = code; }
  public Integer getType() { return type; }
  public void setType(Integer type) { this.type = type; }
  public Integer getStatus() { return status; }
  public void setStatus(Integer status) { this.status = status; }
  public LocalDateTime getValidUntil() { return validUntil; }
  public void setValidUntil(LocalDateTime validUntil) { this.validUntil = validUntil; }
  public Long getUserId() { return userId; }
  public void setUserId(Long userId) { this.userId = userId; }
  public String getOrderNo() { return orderNo; }
  public void setOrderNo(String orderNo) { this.orderNo = orderNo; }
  public String getBatchNo() { return batchNo; }
  public void setBatchNo(String batchNo) { this.batchNo = batchNo; }
  public String getQrContent() { return qrContent; }
  public void setQrContent(String qrContent) { this.qrContent = qrContent; }
  public String getUsedBookingId() { return usedBookingId; }
  public void setUsedBookingId(String usedBookingId) { this.usedBookingId = usedBookingId; }
  public LocalDateTime getUsedAt() { return usedAt; }
  public void setUsedAt(LocalDateTime usedAt) { this.usedAt = usedAt; }
  public String getRemark() { return remark; }
  public void setRemark(String remark) { this.remark = remark; }
  public Integer getDeleted() { return deleted; }
  public void setDeleted(Integer deleted) { this.deleted = deleted; }
  public Integer getVersion() { return version; }
  public void setVersion(Integer version) { this.version = version; }
  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
  public LocalDateTime getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
