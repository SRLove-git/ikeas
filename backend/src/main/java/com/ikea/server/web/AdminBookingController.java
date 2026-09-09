package com.ikea.server.web;

import com.ikea.server.entity.Booking;
import com.ikea.server.service.BookingService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/bookings")
public class AdminBookingController {

  private final BookingService bookingService;

  public AdminBookingController(BookingService bookingService) {
    this.bookingService = bookingService;
  }

  @GetMapping
  public List<Booking> bookings(
      @RequestParam(required = false) String q,
      @RequestParam(required = false) Integer status) {
    return bookingService.listBookings(q, status);
  }

  @PatchMapping("/{id}/status")
  public Map<String, Boolean> updateStatus(
      @PathVariable Long id, @RequestBody Map<String, Integer> body) {
    bookingService.updateStatus(id, body.get("status"));
    return Map.of("ok", true);
  }

  @PostMapping("/redeem")
  public Booking redeem(@RequestBody Map<String, String> body) {
    return bookingService.redeemByCode(body.get("code"));
  }

  @DeleteMapping("/{id}")
  public Map<String, Boolean> deleteBooking(@PathVariable Long id) {
    bookingService.deleteBooking(id);
    return Map.of("ok", true);
  }
}
