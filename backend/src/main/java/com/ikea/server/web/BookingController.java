package com.ikea.server.web;

import com.ikea.server.constant.SecurityConstants;
import com.ikea.server.dto.booking.BookingDtos.CreateBookingRequest;
import com.ikea.server.entity.Booking;
import com.ikea.server.service.BookingService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/bookings")
public class BookingController {

  private final BookingService bookingService;

  public BookingController(BookingService bookingService) {
    this.bookingService = bookingService;
  }

  @GetMapping("/quota")
  public Map<String, Integer> quota() {
    return bookingService.bookingQuota();
  }

  @PostMapping
  public ResponseEntity<Booking> createBooking(
      @RequestBody CreateBookingRequest request, HttpServletRequest httpRequest) {
    String userIdValue =
        (String) httpRequest.getAttribute(SecurityConstants.USER_ID_ATTRIBUTE);
    Long userId = userIdValue == null ? null : Long.valueOf(userIdValue);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(bookingService.createBooking(request, userId));
  }
}
