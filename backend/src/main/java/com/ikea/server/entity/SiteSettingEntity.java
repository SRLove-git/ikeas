package com.ikea.server.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.ikea.server.config.JsonbTypeHandler;

/** 站点设置（数据库表 site_setting，单例）。 */
@TableName(value = "site_setting", autoResultMap = true)
public class SiteSettingEntity extends AuditEntity {

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
