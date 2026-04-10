package com.engine.platform.controller;

import com.engine.platform.dto.BookingRequest;
import com.engine.platform.model.Booking;
import com.engine.platform.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Booking endpoints.
 *
 * Security model:
 * - mechanicId is NEVER accepted from the path for accept/start/complete operations.
 *   The acting mechanic is always derived from the JWT token via SecurityUtils.
 * - clientId is NEVER accepted from the path for booking creation.
 *   The client is always derived from the JWT token.
 */
@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    /** Create a booking. Client is set from JWT. */
    @PostMapping
    public ResponseEntity<Booking> createBooking(@Valid @RequestBody BookingRequest request) {
        return ResponseEntity.ok(bookingService.createBooking(request));
    }

    /**
     * Accept a booking (MECHANIC only).
     * The mechanic accepting the booking is derived from JWT — no mechanicId in path.
     */
    @PutMapping("/{bookingId}/accept")
    public ResponseEntity<Booking> acceptBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(bookingService.acceptBooking(bookingId));
    }

    /**
     * Start a booking (MECHANIC only).
     * The calling mechanic must be the assigned mechanic (verified from JWT).
     */
    @PutMapping("/{bookingId}/start")
    public ResponseEntity<Booking> startBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(bookingService.startBooking(bookingId));
    }

    /**
     * Complete a booking (MECHANIC only).
     * The calling mechanic must be the assigned mechanic (verified from JWT).
     */
    @PutMapping("/{bookingId}/complete")
    public ResponseEntity<Booking> completeBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(bookingService.completeBooking(bookingId));
    }

    /** Cancel a booking. Only the booking client or assigned mechanic can cancel. */
    @PutMapping("/{bookingId}/cancel")
    public ResponseEntity<Booking> cancelBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(bookingService.cancelBooking(bookingId));
    }

    /** Get the authenticated user's bookings. */
    @GetMapping("/my")
    public ResponseEntity<List<Booking>> getMyBookings() {
        return ResponseEntity.ok(bookingService.getMyBookings());
    }

    /** Get a specific booking by id (accessible by client or assigned mechanic). */
    @GetMapping("/{bookingId}")
    public ResponseEntity<Booking> getBookingById(@PathVariable Long bookingId) {
        return ResponseEntity.ok(bookingService.getBookingById(bookingId));
    }
}
