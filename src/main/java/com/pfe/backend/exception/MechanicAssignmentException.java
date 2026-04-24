package com.pfe.backend.exception;

import org.springframework.http.HttpStatus;

public class MechanicAssignmentException extends DomainException {
    public MechanicAssignmentException(String message) {
        super(message, "BOOKING_MECHANIC_ASSIGNMENT", "BOOKING", "ASSIGNMENT_CHECK", HttpStatus.FORBIDDEN);
    }
}