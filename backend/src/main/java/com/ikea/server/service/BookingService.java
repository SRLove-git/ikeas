package com.ikea.server.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.ikea.server.dto.booking.BookingDtos.CreateBookingRequest;
import com.ikea.server.entity.Booking;
import com.ikea.server.entity.Coupon;
import com.ikea.server.mapper.BookingMapper;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 到店体验预约：顾客凭线下体检券下单，管理端确认、完成或取消。 */
@Service
public class BookingService {

  private static final String PHONE_PATTERN = "^\\+?[0-9][0-9\\s-]{5,19}$";
  private static final String EMAIL_PATTERN = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";
  private static final int DAILY_BOOKING_LIMIT = 6;
  private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Singapore");

  private final BookingMapper bookingMapper;
  private final ExperienceVoucherService voucherService;
  private final MarketingService marketingService;

  public BookingService(
      BookingMapper bookingMapper,
      ExperienceVoucherService voucherService,
      MarketingService marketingService) {
    this.bookingMapper = bookingMapper;
    this.voucherService = voucherService;
    this.marketingService = marketingService;
  }

  @Transactional
  public Booking createBooking(CreateBookingRequest request, Long userId) {
    String customerName = trim(request == null ? null : request.customerName());
    String phone = trim(request == null ? null : request.phone());
    String email = trim(request == null ? null : request.email());
    Long couponId = request == null ? null : request.couponId();
    List<String> voucherCodes = normalizeVoucherCodes(request);
    String voucherCode = voucherCodes.isEmpty() ? "" : voucherCodes.get(0);
    String serviceType = trim(request == null ? null : request.serviceType());
    String store = trim(request == null ? null : request.store());
    String preferredDate = trim(request == null ? null : request.preferredDate());

    if (customerName.isBlank()
        || email.isBlank()
        || (couponId == null && voucherCodes.isEmpty())
        || serviceType.isBlank()
        || store.isBlank()
        || preferredDate.isBlank()) {
      throw new IllegalArgumentException("请填写姓名、邮箱、券码、服务项目、门店与预约日期");
    }
    if (!phone.isBlank() && !phone.matches(PHONE_PATTERN)) {
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

    if (!isWeekday(date)) {
      throw new IllegalArgumentException("周六、周日不可预约，请选择周一至周五");
    }
    if (countBookingsToday() >= DAILY_BOOKING_LIMIT) {
      throw new IllegalArgumentException("今日预约已满，请明天再试");
    }

    String bookingNo = "BK-" + System.currentTimeMillis();
    String codesText;
    if (couponId != null) {
      Coupon coupon = marketingService.couponById(couponId);
      marketingService.redeemCouponForBooking(userId, couponId, bookingNo);
      voucherCode = coupon.getCode();
      codesText = coupon.getCode();
    } else if (voucherCodes.size() == 1) {
      voucherService.redeemForBooking(voucherCodes.get(0), bookingNo, email);
      codesText = voucherCodes.get(0);
    } else if (voucherCodes.size() == 3) {
      codesText = voucherService.redeemPointVouchersForBooking(voucherCodes, bookingNo);
      voucherCode = voucherCodes.get(0);
    } else {
      throw new IllegalArgumentException("请提供 1 张体验券或 3 张积分券");
    }

    Booking booking = new Booking();
    booking.setBookingNo(bookingNo);
    booking.setCustomerName(customerName);
    booking.setPhone(phone);
    booking.setEmail(email);
    booking.setVoucherCode(voucherCode);
    booking.setVoucherCodes(codesText);
    booking.setServiceType(serviceType);
    booking.setStore(store);
    booking.setPreferredDate(date);
    booking.setTimeSlot(trim(request.timeSlot()));
    booking.setNote(trim(request.note()));
    booking.setStatus(0);
    bookingMapper.insert(booking);

    return booking;
  }

  private boolean isWeekday(LocalDate date) {
    DayOfWeek day = date.getDayOfWeek();
    return day != DayOfWeek.SATURDAY && day != DayOfWeek.SUNDAY;
  }

  /** 统计今天（按新加坡时区，不含已取消）创建的预约数量，用于“今天最多约 6 人”限流。 */
  public int countBookingsToday() {
    LocalDateTime todayStartUtc =
        LocalDate.now(BUSINESS_ZONE)
            .atStartOfDay(BUSINESS_ZONE)
            .withZoneSameInstant(ZoneOffset.UTC)
            .toLocalDateTime();
    Long count =
        bookingMapper.selectCount(
            Wrappers.lambdaQuery(Booking.class)
                .eq(Booking::getDeleted, 0)
                .ge(Booking::getCreatedAt, todayStartUtc)
                .ne(Booking::getStatus, 3));
    return count == null ? 0 : count.intValue();
  }

  public Map<String, Integer> bookingQuota() {
    int booked = countBookingsToday();
    return Map.of(
        "limit", DAILY_BOOKING_LIMIT,
        "booked", booked,
        "remaining", Math.max(0, DAILY_BOOKING_LIMIT - booked));
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
                  .like(Booking::getVoucherCode, like.toUpperCase())
                  .or()
                  .like(Booking::getVoucherCodes, like.toUpperCase()));
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

  /** 工作人员核销：按券码或预约编号找到预约并标记为已完成。 */
  @Transactional
  public Booking redeemByCode(String code) {
    String normalized = code == null ? "" : code.trim().toUpperCase();
    if (normalized.isBlank()) {
      throw new IllegalArgumentException("请输入券码或预约编号");
    }
    Booking booking =
        bookingMapper.selectOne(
            Wrappers.lambdaQuery(Booking.class)
                .eq(Booking::getDeleted, 0)
                .and(
                    q ->
                        q.eq(Booking::getVoucherCode, normalized)
                            .or()
                            .like(Booking::getVoucherCodes, normalized)
                            .or()
                            .eq(Booking::getBookingNo, normalized))
                .last("LIMIT 1"));
    if (booking == null) {
      throw new IllegalArgumentException("未找到该券码对应的预约");
    }
    if (booking.getStatus() != null && booking.getStatus() == 2) {
      throw new IllegalArgumentException("该预约已核销");
    }
    if (booking.getStatus() != null && booking.getStatus() == 3) {
      throw new IllegalArgumentException("该预约已取消");
    }
    booking.setStatus(2);
    bookingMapper.updateById(booking);
    return booking;
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

  private List<String> normalizeVoucherCodes(CreateBookingRequest request) {
    LinkedHashSet<String> unique = new LinkedHashSet<>();
    if (request != null && request.voucherCodes() != null && !request.voucherCodes().isEmpty()) {
      for (String code : request.voucherCodes()) {
        String normalized = trim(code).toUpperCase();
        if (!normalized.isBlank()) {
          unique.add(normalized);
        }
      }
    }
    if (unique.isEmpty() && request != null && !trim(request.voucherCode()).isBlank()) {
      unique.add(trim(request.voucherCode()).toUpperCase());
    }
    return new ArrayList<>(unique);
  }
}
