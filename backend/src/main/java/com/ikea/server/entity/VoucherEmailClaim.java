package com.ikea.server.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.Version;
import java.time.LocalDateTime;

/** 线下会议密钥领取体验券的邮箱登记记录，用于同一邮箱 + 同一密钥去重。 */
@TableName("voucher_email_claim")
public class VoucherEmailClaim {

  @TableId(type = IdType.ASSIGN_ID)
  private Long id;

  private String email;
  private Long voucherId;
  private String secret;
  private String ip;
  private String deviceId;
  private Integer status;

  @TableLogic private Integer deleted;

  @Version private Integer version;

  @TableField(fill = FieldFill.INSERT) private LocalDateTime createdAt;

  @TableField(fill = FieldFill.INSERT_UPDATE) private LocalDateTime updatedAt;

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }
  public Long getVoucherId() { return voucherId; }
  public void setVoucherId(Long voucherId) { this.voucherId = voucherId; }
  public String getSecret() { return secret; }
  public void setSecret(String secret) { this.secret = secret; }
  public String getIp() { return ip; }
  public void setIp(String ip) { this.ip = ip; }
  public String getDeviceId() { return deviceId; }
  public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
  public Integer getStatus() { return status; }
  public void setStatus(Integer status) { this.status = status; }
  public Integer getDeleted() { return deleted; }
  public void setDeleted(Integer deleted) { this.deleted = deleted; }
  public Integer getVersion() { return version; }
  public void setVersion(Integer version) { this.version = version; }
  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
  public LocalDateTime getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
