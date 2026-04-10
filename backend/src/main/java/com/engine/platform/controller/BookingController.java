package com.engine.platform.controller;

import com.engine.platform.dto.BookingRequest;
import com.engine.platform.entity.Booking;
import com.engine.platform.entity.User;
import com.engine.platform.security.SecurityUtils;
import com.engine.platform.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Booking endpoints — no userId/mechanicId in URL; identity comes from JWT.
 *
 * POST /api/bookings                   → CLIENT creates booking
 * POST /api/bookings/{id}/accept       → MECHANIC accepts (mechanicId from JWT)
 * POST /api/bookings/{id}/start        → MECHANIC starts (must be assigned)
 * POST /api/bookings/{id}/complete     → MECHANIC completes (must be assigned)
 * POST /api/bookings/{id}/cancel       → CLIENT cancels own booking
 * GET  /api/bookings/my               → authenticated user's bookings
 * GET  /api/bookings/{id}             → allowed if client owns or mechanic assigned
 */
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @PreAuthorize("hasAuthority('CLIENT')")
    public ResponseEntity<Booking> create(@Valid @RequestBody BookingRequest request) {
        User client = SecurityUtils.getCurrentUser();
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.create(request, client));
    }

    @PostMapping("/{id}/accept")
    @PreAuthorize("hasAuthority('MECHANIC')")
    public ResponseEntity<Booking> accept(@PathVariable Long id) {
        User mechanic = SecurityUtils.getCurrentUser();
        return ResponseEntity.ok(bookingService.accept(id, mechanic));
    }

    @PostMapping("/{id}/start")
    @PreAuthorize("hasAuthority('MECHANIC')")
    public ResponseEntity<Booking> start(@PathVariable Long id) {
        User mechanic = SecurityUtils.getCurrentUser();
        return ResponseEntity.ok(bookingService.start(id, mechanic));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAuthority('MECHANIC')")
    public ResponseEntity<Booking> complete(@PathVariable Long id) {
        User mechanic = SecurityUtils.getCurrentUser();
        return ResponseEntity.ok(bookingService.complete(id, mechanic));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('CLIENT')")
    public ResponseEntity<Booking> cancel(@PathVariable Long id) {
        User client = SecurityUtils.getCurrentUser();
        return ResponseEntity.ok(bookingService.cancel(id, client));
    }

    @GetMapping("/my")
    public ResponseEntity<List<Booking>> getMyBookings() {
        User user = SecurityUtils.getCurrentUser();
        return ResponseEntity.ok(bookingService.getMyBookings(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Booking> getById(@PathVariable Long id) {
        User user = SecurityUtils.getCurrentUser();
        return ResponseEntity.ok(bookingService.getBookingForCurrentUser(id, user));
    }
}
