package com.ikea.server.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.ikea.server.config.JsonbTypeHandler;

/** 首页/头部 mega menu 面板（数据库表 menu_panel）。 */
@TableName(value = "menu_panel", autoResultMap = true)
public class MenuPanelEntity extends AuditEntity {

  private String label;
  private String href;

  @TableField(typeHandler = JsonbTypeHandler.class)
  private String payload;

  public String getLabel() {
    return label;
  }

  public void setLabel(String label) {
    this.label = label;
  }

  public String getHref() {
    return href;
  }

  public void setHref(String href) {
    this.href = href;
  }

  public String getPayload() {
    return payload;
  }

  public void setPayload(String payload) {
    this.payload = payload;
  }
}
