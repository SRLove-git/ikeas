package com.ikea.server.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.Version;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** 到店体检预约。状态：0=待确认，1=已确认，2=已完成，3=已取消。 */
@TableName("booking")
public class Booking {

  @TableId(type = IdType.ASSIGN_ID)
  private Long id;
  private String bookingNo;
  private String customerName;
  private String phone;
  private String email;
  private String voucherCode;
  private String voucherCodes;
  private String serviceType;
  private String store;
  private LocalDate preferredDate;
  private String timeSlot;
  private String note;
  private Integer status;
  @TableLogic private Integer deleted;
  @Version private Integer version;
  @TableField(fill = FieldFill.INSERT) private LocalDateTime createdAt;
  @TableField(fill = FieldFill.INSERT_UPDATE) private LocalDateTime updatedAt;

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public String getBookingNo() { return bookingNo; }
  public void setBookingNo(String bookingNo) { this.bookingNo = bookingNo; }
  public String getCustomerName() { return customerName; }
  public void setCustomerName(String customerName) { this.customerName = customerName; }
  public String getPhone() { return phone; }
  public void setPhone(String phone) { this.phone = phone; }
  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }
  public String getVoucherCode() { return voucherCode; }
  public void setVoucherCode(String voucherCode) { this.voucherCode = voucherCode; }
  public String getVoucherCodes() { return voucherCodes; }
  public void setVoucherCodes(String voucherCodes) { this.voucherCodes = voucherCodes; }
  public String getServiceType() { return serviceType; }
  public void setServiceType(String serviceType) { this.serviceType = serviceType; }
  public String getStore() { return store; }
  public void setStore(String store) { this.store = store; }
  public LocalDate getPreferredDate() { return preferredDate; }
  public void setPreferredDate(LocalDate preferredDate) { this.preferredDate = preferredDate; }
  public String getTimeSlot() { return timeSlot; }
  public void setTimeSlot(String timeSlot) { this.timeSlot = timeSlot; }
  public String getNote() { return note; }
  public void setNote(String note) { this.note = note; }
  public Integer getStatus() { return status; }
  public void setStatus(Integer status) { this.status = status; }
  public Integer getDeleted() { return deleted; }
  public void setDeleted(Integer deleted) { this.deleted = deleted; }
  public Integer getVersion() { return version; }
  public void setVersion(Integer version) { this.version = version; }
  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
  public LocalDateTime getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
