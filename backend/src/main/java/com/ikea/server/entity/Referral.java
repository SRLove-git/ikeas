package com.ikea.server.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;

/** 裂变邀请关系。 */
@TableName("referral")
public class Referral {

  @TableId(type = IdType.ASSIGN_ID)
  private Long id;

  private Long inviterId;
  private Long inviteeId;

  @TableField(fill = FieldFill.INSERT)
  private LocalDateTime createdAt;

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public Long getInviterId() { return inviterId; }
  public void setInviterId(Long inviterId) { this.inviterId = inviterId; }
  public Long getInviteeId() { return inviteeId; }
  public void setInviteeId(Long inviteeId) { this.inviteeId = inviteeId; }
  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
