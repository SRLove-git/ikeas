package com.ikea.server.web;

import com.ikea.server.dto.booking.BookingDtos.StaffRedeemRequest;
import com.ikea.server.entity.Booking;
import com.ikea.server.service.BookingService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 门店工作人员独立核销入口，不登录完整管理后台。 */
@RestController
@RequestMapping("/api/v1/staff")
public class StaffRedeemController {

  private final BookingService bookingService;

  public StaffRedeemController(BookingService bookingService) {
    this.bookingService = bookingService;
  }

  @PostMapping("/redeem")
  public Booking redeem(@RequestBody StaffRedeemRequest request) {
    return bookingService.redeemByCode(request.code());
  }

  @GetMapping("/bookings")
  public List<Booking> bookings() {
    return bookingService.listBookings(null, null);
  }
}
