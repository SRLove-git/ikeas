package com.ikea.server.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.ikea.server.config.JsonbTypeHandler;

/** 商品静态内容（数据库表 product）。 */
@TableName(value = "product", autoResultMap = true)
public class ProductEntity extends AuditEntity {

  private String productId;
  private String slug;

  @TableField(typeHandler = JsonbTypeHandler.class)
  private String payload;

  public String getProductId() {
    return productId;
  }

  public void setProductId(String productId) {
    this.productId = productId;
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
