package com.ikea.server.entity;

import com.baomidou.mybatisplus.annotation.TableName;

@TableName("after_sale_request")
public class AfterSaleRequest extends AuditEntity {

  private String orderNo;
  private Long userId;
  private Integer type;
  private String reason;
  private Integer status;
  private String omsReturnNo;

  public String getOrderNo() { return orderNo; }
  public void setOrderNo(String orderNo) { this.orderNo = orderNo; }
  public Long getUserId() { return userId; }
  public void setUserId(Long userId) { this.userId = userId; }
  public Integer getType() { return type; }
  public void setType(Integer type) { this.type = type; }
  public String getReason() { return reason; }
  public void setReason(String reason) { this.reason = reason; }
  public Integer getStatus() { return status; }
  public void setStatus(Integer status) { this.status = status; }
  public String getOmsReturnNo() { return omsReturnNo; }
  public void setOmsReturnNo(String omsReturnNo) { this.omsReturnNo = omsReturnNo; }
}
