package com.ikea.server.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.Version;
import java.time.LocalDateTime;

/** 线下印刷后由后台录入的实体体验券。状态：0=未使用，1=已使用，2=停用。 */
@TableName("experience_voucher")
public class ExperienceVoucher {

  @TableId(type = IdType.ASSIGN_ID)
  private Long id;
  private String code;
  private Integer status;
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
  public Integer getStatus() { return status; }
  public void setStatus(Integer status) { this.status = status; }
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
