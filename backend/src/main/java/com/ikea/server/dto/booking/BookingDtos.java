package com.ikea.server.dto.booking;

public final class BookingDtos {

  private BookingDtos() {}

  public record CreateBookingRequest(
      String customerName,
      String phone,
      String email,
      String voucherCode,
      String serviceType,
      String store,
      String preferredDate,
      String timeSlot,
      String note) {}

  public record AdminUpdateBookingStatusRequest(Integer status) {}
}
