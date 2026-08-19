package com.ikea.server.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.ikea.server.config.JsonbTypeHandler;

/** 客服知识库（数据库表 chat_knowledge，单例）。 */
@TableName(value = "chat_knowledge", autoResultMap = true)
public class ChatKnowledgeEntity extends AuditEntity {

  private Integer singletonKey;

  @TableField(typeHandler = JsonbTypeHandler.class)
  private String payload;

  public Integer getSingletonKey() {
    return singletonKey;
  }

  public void setSingletonKey(Integer singletonKey) {
    this.singletonKey = singletonKey;
  }

  public String getPayload() {
    return payload;
  }

  public void setPayload(String payload) {
    this.payload = payload;
  }
}
