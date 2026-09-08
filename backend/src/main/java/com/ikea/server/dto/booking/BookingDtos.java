package com.ikea.server.dto.booking;

import java.util.List;

public final class BookingDtos {

  private BookingDtos() {}

  public record CreateBookingRequest(
      String customerName,
      String phone,
      String email,
      String voucherCode,
      List<String> voucherCodes,
      String serviceType,
      String store,
      String preferredDate,
      String timeSlot,
      String note) {}

  public record AdminUpdateBookingStatusRequest(Integer status) {}
}
