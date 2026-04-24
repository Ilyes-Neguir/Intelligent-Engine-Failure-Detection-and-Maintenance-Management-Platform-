package com.pfe.backend.controller;

import com.pfe.backend.booking.BookingService;
import com.pfe.backend.booking.dto.BookingDTO;
import com.pfe.backend.booking.dto.BookingResponseDTO;
import com.pfe.backend.booking.dto.CompleteBookingRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @PreAuthorize("hasAuthority('CLIENT')")
    public ResponseEntity<BookingResponseDTO> createBooking(Authentication authentication, @Valid @RequestBody BookingDTO dto) {
        return ResponseEntity.ok(bookingService.createBookingDto(dto, authentication));
    }

    @GetMapping("/my")
    public ResponseEntity<List<BookingResponseDTO>> getMyBookings(Authentication authentication) {
        return ResponseEntity.ok(bookingService.getMyBookingsDto(authentication));
    }

    @PostMapping("/{id}/accept")
    @PreAuthorize("hasAuthority('MECHANIC')")
    public ResponseEntity<BookingResponseDTO> acceptBooking(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(bookingService.acceptBookingDto(id, authentication));
    }

    @PostMapping("/{id}/start")
    @PreAuthorize("hasAuthority('MECHANIC')")
    public ResponseEntity<BookingResponseDTO> startBooking(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(bookingService.startBookingDto(id, authentication));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAuthority('MECHANIC')")
    public ResponseEntity<BookingResponseDTO> completeBooking(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody CompleteBookingRequest request) {
        return ResponseEntity.ok(bookingService.completeBookingDto(id, request.getNotes(), authentication));
    }
}