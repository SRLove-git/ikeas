package com.ikea.server.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;

@TableName("support_ticket")
public class SupportTicket extends AuditEntity {

  private String ticketNo;
  private Long userId;
  private String orderNo;
  private String afterSaleNo;
  private String subject;
  private String message;
  private Integer status;
  private String assignee;
  private String reply;
  private LocalDateTime repliedAt;

  public String getTicketNo() { return ticketNo; }
  public void setTicketNo(String ticketNo) { this.ticketNo = ticketNo; }
  public Long getUserId() { return userId; }
  public void setUserId(Long userId) { this.userId = userId; }
  public String getOrderNo() { return orderNo; }
  public void setOrderNo(String orderNo) { this.orderNo = orderNo; }
  public String getAfterSaleNo() { return afterSaleNo; }
  public void setAfterSaleNo(String afterSaleNo) { this.afterSaleNo = afterSaleNo; }
  public String getSubject() { return subject; }
  public void setSubject(String subject) { this.subject = subject; }
  public String getMessage() { return message; }
  public void setMessage(String message) { this.message = message; }
  public Integer getStatus() { return status; }
  public void setStatus(Integer status) { this.status = status; }
  public String getAssignee() { return assignee; }
  public void setAssignee(String assignee) { this.assignee = assignee; }
  public String getReply() { return reply; }
  public void setReply(String reply) { this.reply = reply; }
  public LocalDateTime getRepliedAt() { return repliedAt; }
  public void setRepliedAt(LocalDateTime repliedAt) { this.repliedAt = repliedAt; }
}
