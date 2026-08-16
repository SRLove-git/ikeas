package com.ikea.server.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.ikea.server.config.JsonbTypeHandler;

/** 顶部导航分类（数据库表 menu_category）。 */
@TableName(value = "menu_category", autoResultMap = true)
public class MenuCategoryEntity extends AuditEntity {

  private String name;
  private String url;

  @TableField(typeHandler = JsonbTypeHandler.class)
  private String payload;

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getUrl() {
    return url;
  }

  public void setUrl(String url) {
    this.url = url;
  }

  public String getPayload() {
    return payload;
  }

  public void setPayload(String payload) {
    this.payload = payload;
  }
}
