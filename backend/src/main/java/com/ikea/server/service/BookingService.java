package com.ikea.server.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.ikea.server.dto.booking.BookingDtos.CreateBookingRequest;
import com.ikea.server.entity.Booking;
import com.ikea.server.mapper.BookingMapper;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 到店体检预约：顾客凭线下体检券下单，管理端确认、完成或取消。 */
@Service
public class BookingService {

  private static final String PHONE_PATTERN = "^[89]\\d{7}$";
  private static final String EMAIL_PATTERN = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";

  private final BookingMapper bookingMapper;
  private final ExperienceVoucherService voucherService;

  public BookingService(BookingMapper bookingMapper, ExperienceVoucherService voucherService) {
    this.bookingMapper = bookingMapper;
    this.voucherService = voucherService;
  }

  @Transactional
  public Booking createBooking(CreateBookingRequest request) {
    String customerName = trim(request == null ? null : request.customerName());
    String phone = trim(request == null ? null : request.phone());
    String email = trim(request == null ? null : request.email());
    String voucherCode = trim(request == null ? null : request.voucherCode()).toUpperCase();
    String serviceType = trim(request == null ? null : request.serviceType());
    String store = trim(request == null ? null : request.store());
    String preferredDate = trim(request == null ? null : request.preferredDate());

    if (customerName.isBlank()
        || phone.isBlank()
        || email.isBlank()
        || voucherCode.isBlank()
        || serviceType.isBlank()
        || store.isBlank()
        || preferredDate.isBlank()) {
      throw new IllegalArgumentException("请填写姓名、联系方式、体检券码、服务项目、门店与预约日期");
    }
    if (!phone.matches(PHONE_PATTERN)) {
      throw new IllegalArgumentException("手机号格式不正确");
    }
    if (!email.matches(EMAIL_PATTERN)) {
      throw new IllegalArgumentException("邮箱格式不正确");
    }
    LocalDate date;
    try {
      date = LocalDate.parse(preferredDate);
    } catch (DateTimeParseException e) {
      throw new IllegalArgumentException("预约日期格式不正确");
    }

    String bookingNo = "BK-" + System.currentTimeMillis();
    voucherService.redeemForBooking(voucherCode, bookingNo);

    Booking booking = new Booking();
    booking.setBookingNo(bookingNo);
    booking.setCustomerName(customerName);
    booking.setPhone(phone);
    booking.setEmail(email);
    booking.setVoucherCode(voucherCode);
    booking.setServiceType(serviceType);
    booking.setStore(store);
    booking.setPreferredDate(date);
    booking.setTimeSlot(trim(request.timeSlot()));
    booking.setNote(trim(request.note()));
    booking.setStatus(0);
    bookingMapper.insert(booking);

    return booking;
  }

  public List<Booking> listBookings(String keyword, Integer status) {
    var query = Wrappers.lambdaQuery(Booking.class).eq(Booking::getDeleted, 0);
    if (keyword != null && !keyword.isBlank()) {
      String like = keyword.trim();
      query.and(
          q ->
              q.like(Booking::getBookingNo, like)
                  .or()
                  .like(Booking::getCustomerName, like)
                  .or()
                  .like(Booking::getPhone, like)
                  .or()
                  .like(Booking::getEmail, like)
                  .or()
                  .like(Booking::getVoucherCode, like.toUpperCase()));
    }
    if (status != null) {
      query.eq(Booking::getStatus, status);
    }
    return bookingMapper.selectList(query.orderByDesc(Booking::getCreatedAt));
  }

  @Transactional
  public void updateStatus(Long id, Integer status) {
    if (status == null || (status != 1 && status != 2 && status != 3)) {
      throw new IllegalArgumentException("预约状态不正确");
    }
    Booking booking = bookingMapper.selectById(id);
    if (booking == null || booking.getDeleted() != null && booking.getDeleted() == 1) {
      throw new IllegalArgumentException("预约不存在");
    }
    if (booking.getStatus() != null && (booking.getStatus() == 2 || booking.getStatus() == 3)) {
      throw new IllegalArgumentException("预约已结束，不能修改状态");
    }
    booking.setStatus(status);
    bookingMapper.updateById(booking);
    if (status == 3) {
      voucherService.releaseByBookingId(booking.getBookingNo());
    }
  }

  @Transactional
  public void deleteBooking(Long id) {
    Booking booking = bookingMapper.selectById(id);
    if (booking == null || booking.getDeleted() != null && booking.getDeleted() == 1) {
      throw new IllegalArgumentException("预约不存在");
    }
    if (booking.getStatus() != null && booking.getStatus() == 2) {
      throw new IllegalArgumentException("已完成的预约不能删除");
    }
    bookingMapper.deleteById(id);
    voucherService.releaseByBookingId(booking.getBookingNo());
  }

  private String trim(String value) {
    return value == null ? "" : value.trim();
  }
}
