package com.ikea.server.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.ikea.server.config.JsonbTypeHandler;

/** 内容页（数据库表 content_page）。 */
@TableName(value = "content_page", autoResultMap = true)
public class ContentPageEntity extends AuditEntity {

  private String url;
  private String family;

  @TableField(typeHandler = JsonbTypeHandler.class)
  private String payload;

  public String getUrl() {
    return url;
  }

  public void setUrl(String url) {
    this.url = url;
  }

  public String getFamily() {
    return family;
  }

  public void setFamily(String family) {
    this.family = family;
  }

  public String getPayload() {
    return payload;
  }

  public void setPayload(String payload) {
    this.payload = payload;
  }
}
