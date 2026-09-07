package com.ikea.server.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;

/** 裂变邀请奖励流水。 */
@TableName("referral_reward")
public class ReferralReward {

  @TableId(type = IdType.ASSIGN_ID)
  private Long id;

  private Long inviterId;
  private Long inviteeId;
  private Long couponId;
  private Long userCouponId;
  private String rewardType;

  @TableField(fill = FieldFill.INSERT)
  private LocalDateTime createdAt;

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public Long getInviterId() { return inviterId; }
  public void setInviterId(Long inviterId) { this.inviterId = inviterId; }
  public Long getInviteeId() { return inviteeId; }
  public void setInviteeId(Long inviteeId) { this.inviteeId = inviteeId; }
  public Long getCouponId() { return couponId; }
  public void setCouponId(Long couponId) { this.couponId = couponId; }
  public Long getUserCouponId() { return userCouponId; }
  public void setUserCouponId(Long userCouponId) { this.userCouponId = userCouponId; }
  public String getRewardType() { return rewardType; }
  public void setRewardType(String rewardType) { this.rewardType = rewardType; }
  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
