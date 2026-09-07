package com.ikea.server.entity;

import com.baomidou.mybatisplus.annotation.TableName;

@TableName("invoice_receipt")
public class InvoiceReceipt extends AuditEntity {

  private String orderNo;
  private Long userId;
  private Integer kind;
  private String companyName;
  private String taxNumber;
  private String email;
  private Integer status;
  private String fileUrl;
  private String errorMessage;

  public String getOrderNo() { return orderNo; }
  public void setOrderNo(String orderNo) { this.orderNo = orderNo; }
  public Long getUserId() { return userId; }
  public void setUserId(Long userId) { this.userId = userId; }
  public Integer getKind() { return kind; }
  public void setKind(Integer kind) { this.kind = kind; }
  public String getCompanyName() { return companyName; }
  public void setCompanyName(String companyName) { this.companyName = companyName; }
  public String getTaxNumber() { return taxNumber; }
  public void setTaxNumber(String taxNumber) { this.taxNumber = taxNumber; }
  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }
  public Integer getStatus() { return status; }
  public void setStatus(Integer status) { this.status = status; }
  public String getFileUrl() { return fileUrl; }
  public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
  public String getErrorMessage() { return errorMessage; }
  public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
}
