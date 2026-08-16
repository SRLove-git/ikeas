package com.ikea.server.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.ikea.server.config.JsonbTypeHandler;

/** 商品分类（数据库表 catalog_category）。 */
@TableName(value = "catalog_category", autoResultMap = true)
public class CatalogCategoryEntity extends AuditEntity {

  private String slug;
  private String kind;

  @TableField(typeHandler = JsonbTypeHandler.class)
  private String payload;

  public String getSlug() {
    return slug;
  }

  public void setSlug(String slug) {
    this.slug = slug;
  }

  public String getKind() {
    return kind;
  }

  public void setKind(String kind) {
    this.kind = kind;
  }

  public String getPayload() {
    return payload;
  }

  public void setPayload(String payload) {
    this.payload = payload;
  }
}
