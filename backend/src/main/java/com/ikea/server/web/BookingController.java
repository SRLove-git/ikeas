package com.ikea.server.web;

import com.ikea.server.dto.booking.BookingDtos.CreateBookingRequest;
import com.ikea.server.entity.Booking;
import com.ikea.server.service.BookingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

  @PostMapping
  public ResponseEntity<Booking> createBooking(@RequestBody CreateBookingRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.createBooking(request));
  }
}
