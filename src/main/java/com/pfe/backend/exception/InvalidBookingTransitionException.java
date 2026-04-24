package com.pfe.backend.exception;

import org.springframework.http.HttpStatus;

public class InvalidBookingTransitionException extends DomainException {
    public InvalidBookingTransitionException(String message) {
        super(message, "BOOKING_INVALID_TRANSITION", "BOOKING", "STATE_CHANGE", HttpStatus.BAD_REQUEST);
    }
}