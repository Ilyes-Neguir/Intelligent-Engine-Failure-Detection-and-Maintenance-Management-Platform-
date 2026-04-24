package com.pfe.backend.exception;

import org.springframework.http.HttpStatus;

public class BookingNotFoundException extends DomainException {
    public BookingNotFoundException(Long id) {
        super("Booking not found with id: " + id, "BOOKING_NOT_FOUND", "BOOKING", "READ", HttpStatus.NOT_FOUND);
    }
}