package com.ikea.server.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.ikea.server.config.JsonbTypeHandler;

/** 分类落地页（数据库表 catalog_page）。 */
@TableName(value = "catalog_page", autoResultMap = true)
public class CatalogPageEntity extends AuditEntity {

  private String url;
  private String slug;

  @TableField(typeHandler = JsonbTypeHandler.class)
  private String payload;

  public String getUrl() {
    return url;
  }

  public void setUrl(String url) {
    this.url = url;
  }

  public String getSlug() {
    return slug;
  }

  public void setSlug(String slug) {
    this.slug = slug;
  }

  public String getPayload() {
    return payload;
  }

  public void setPayload(String payload) {
    this.payload = payload;
  }
}
