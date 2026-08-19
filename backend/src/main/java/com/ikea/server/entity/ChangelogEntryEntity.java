package com.ikea.server.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.ikea.server.config.JsonbTypeHandler;

/** 管理后台变更日志（数据库表 changelog_entry）。 */
@TableName(value = "changelog_entry", autoResultMap = true)
public class ChangelogEntryEntity extends AuditEntity {

  private String entryId;
  private String userName;
  private String action;
  private String resource;
  private String target;
  private String summary;

  @TableField(typeHandler = JsonbTypeHandler.class)
  private String payload;

  public String getEntryId() {
    return entryId;
  }

  public void setEntryId(String entryId) {
    this.entryId = entryId;
  }

  public String getUserName() {
    return userName;
  }

  public void setUserName(String userName) {
    this.userName = userName;
  }

  public String getAction() {
    return action;
  }

  public void setAction(String action) {
    this.action = action;
  }

  public String getResource() {
    return resource;
  }

  public void setResource(String resource) {
    this.resource = resource;
  }

  public String getTarget() {
    return target;
  }

  public void setTarget(String target) {
    this.target = target;
  }

  public String getSummary() {
    return summary;
  }

  public void setSummary(String summary) {
    this.summary = summary;
  }

  public String getPayload() {
    return payload;
  }

  public void setPayload(String payload) {
    this.payload = payload;
  }
}
