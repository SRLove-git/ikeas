package com.ikea.server.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.conditions.AbstractWrapper;
import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.ikea.server.dto.booking.BookingDtos.CreateBookingRequest;
import com.ikea.server.entity.Booking;
import com.ikea.server.entity.ExperienceVoucher;
import com.ikea.server.mapper.BookingMapper;
import com.ikea.server.mapper.ExperienceVoucherMapper;
import java.util.List;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class BookingServiceTest {

  private BookingMapper bookingMapper;
  private ExperienceVoucherService voucherService;
  private MarketingService marketingService;
  private BookingService bookingService;

  @BeforeAll
  static void initTableInfo() {
    // lambda wrapper 解析列名需要 TableInfo，纯单测环境下手动初始化
    MapperBuilderAssistant assistant = new MapperBuilderAssistant(new MybatisConfiguration(), "");
    TableInfoHelper.initTableInfo(assistant, Booking.class);
    TableInfoHelper.initTableInfo(assistant, ExperienceVoucher.class);
  }

  @BeforeEach
  void setUp() {
    bookingMapper = mock(BookingMapper.class);
    voucherService = mock(ExperienceVoucherService.class);
    marketingService = mock(MarketingService.class);
    bookingService = new BookingService(bookingMapper, voucherService, marketingService);
  }

  @Test
  void createBookingShouldRejectMissingRequiredFields() {
    CreateBookingRequest request =
        new CreateBookingRequest(
            "", "81234567", "a@b.com", "CODE1", null, null, "体检套餐", "门店", "2026-09-10", "上午", null);

    IllegalArgumentException e =
        assertThrows(IllegalArgumentException.class, () -> bookingService.createBooking(request, null));

    assertEquals("请填写姓名、联系方式、券码、服务项目、门店与预约日期", e.getMessage());
    verify(bookingMapper, never()).insert(any(Booking.class));
  }

  @Test
  void createBookingShouldRejectInvalidPhone() {
    CreateBookingRequest request = validRequest("71234567", "a@b.com", "2026-09-10");

    IllegalArgumentException e =
        assertThrows(IllegalArgumentException.class, () -> bookingService.createBooking(request, null));

    assertEquals("手机号格式不正确", e.getMessage());
    verify(bookingMapper, never()).insert(any(Booking.class));
  }

  @Test
  void createBookingShouldRejectInvalidDate() {
    CreateBookingRequest request = validRequest("81234567", "a@b.com", "2026/09/10");

    IllegalArgumentException e =
        assertThrows(IllegalArgumentException.class, () -> bookingService.createBooking(request, null));

    assertEquals("预约日期格式不正确", e.getMessage());
    verify(bookingMapper, never()).insert(any(Booking.class));
  }

  @Test
  void createBookingShouldNotInsertWhenVoucherUnavailable() {
    CreateBookingRequest request = validRequest("81234567", "a@b.com", "2026-09-10");
    doThrow(new IllegalArgumentException("体检券已使用"))
        .when(voucherService)
        .redeemForBooking(eq("CODE1"), anyString());

    IllegalArgumentException e =
        assertThrows(IllegalArgumentException.class, () -> bookingService.createBooking(request, null));

    assertEquals("体检券已使用", e.getMessage());
    verify(bookingMapper, never()).insert(any(Booking.class));
  }

  @Test
  void createBookingShouldInsertAndRedeemVoucher() {
    CreateBookingRequest request = validRequest("81234567", "a@b.com", "2026-09-10");

    Booking booking = bookingService.createBooking(request, null);

    ArgumentCaptor<Booking> captor = ArgumentCaptor.forClass(Booking.class);
    verify(bookingMapper).insert(captor.capture());
    assertEquals(booking, captor.getValue());
    assertEquals(0, captor.getValue().getStatus());
    // 请求里是小写 code1，入库与核销都应归一化为大写
    assertEquals("CODE1", captor.getValue().getVoucherCode());
    verify(voucherService).redeemForBooking("CODE1", booking.getBookingNo());
  }

  @Test
  void cancelBookingShouldReleaseVoucher() {
    Booking booking = booking(1L, 0);
    when(bookingMapper.selectById(1L)).thenReturn(booking);

    bookingService.updateStatus(1L, 3);

    assertEquals(3, booking.getStatus());
    verify(bookingMapper).updateById(booking);
    verify(voucherService).releaseByBookingId(booking.getBookingNo());
  }

  @Test
  void releaseByBookingIdShouldUseExplicitNullUpdateWrapper() {
    ExperienceVoucherMapper voucherMapper = mock(ExperienceVoucherMapper.class);
    ExperienceVoucherService realVoucherService =
        new ExperienceVoucherService(
            voucherMapper,
            mock(VoucherPdfService.class),
            "https://medical-sg.com/zh/booking/",
            mock(org.springframework.mail.javamail.JavaMailSender.class),
            "no-reply@example.com");

    realVoucherService.releaseByBookingId("BK-100");

    // updateById 的 NOT_NULL 策略清不掉字段，必须用 wrapper 显式置空
    ArgumentCaptor<Wrapper<ExperienceVoucher>> captor = ArgumentCaptor.forClass(Wrapper.class);
    verify(voucherMapper).update(isNull(), captor.capture());
    verify(voucherMapper, never()).updateById(any(ExperienceVoucher.class));
    var wrapper = (AbstractWrapper<?, ?, ?>) captor.getValue();
    wrapper.getSqlSegment();
    assertTrue(wrapper.getParamNameValuePairs().containsValue("BK-100"));
    assertTrue(wrapper.getParamNameValuePairs().containsValue(null));
  }

  @Test
  void listBookingsShouldUppercaseVoucherCodeKeyword() {
    when(bookingMapper.selectList(any(Wrapper.class))).thenReturn(List.of());

    bookingService.listBookings("test-e2e-001", null);

    ArgumentCaptor<Wrapper<Booking>> captor = ArgumentCaptor.forClass(Wrapper.class);
    verify(bookingMapper).selectList(captor.capture());
    var wrapper = (AbstractWrapper<?, ?, ?>) captor.getValue();
    String sql = wrapper.getSqlSegment();
    assertTrue(sql.contains("voucher_code"));
    var params = wrapper.getParamNameValuePairs().values();
    assertTrue(params.contains("%TEST-E2E-001%"));
    assertTrue(params.contains("%test-e2e-001%"));
  }

  @Test
  void deleteBookingShouldRejectFinishedBooking() {
    when(bookingMapper.selectById(1L)).thenReturn(booking(1L, 2));

    IllegalArgumentException e =
        assertThrows(IllegalArgumentException.class, () -> bookingService.deleteBooking(1L));

    assertEquals("已完成的预约不能删除", e.getMessage());
    verify(bookingMapper, never()).deleteById(any(Long.class));
  }

  private static CreateBookingRequest validRequest(String phone, String email, String date) {
    return new CreateBookingRequest(
        "张三", phone, email, "code1", null, null, "体检套餐", "门店", date, "上午", "备注");
  }

  private static Booking booking(Long id, Integer status) {
    Booking booking = new Booking();
    booking.setId(id);
    booking.setBookingNo("BK-100");
    booking.setStatus(status);
    booking.setDeleted(0);
    return booking;
  }
}
