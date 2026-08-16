package com.ikea.server.entity;

import com.baomidou.mybatisplus.annotation.TableName;

/** 客服聊天记录（数据库表 chat_message）。 */
@TableName("chat_message")
public class ChatMessageEntity extends AuditEntity {

  private Long userId;
  private String message;
  private String reply;

  public Long getUserId() {
    return userId;
  }

  public void setUserId(Long userId) {
    this.userId = userId;
  }

  public String getMessage() {
    return message;
  }

  public void setMessage(String message) {
    this.message = message;
  }

  public String getReply() {
    return reply;
  }

  public void setReply(String reply) {
    this.reply = reply;
  }
}
