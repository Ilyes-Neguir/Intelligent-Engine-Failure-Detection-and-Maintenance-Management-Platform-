package com.pfe.backend.exception;

import org.springframework.http.HttpStatus;

public class DiagnosticNotFoundException extends DomainException {
    public DiagnosticNotFoundException(Long bookingId) {
        super("Diagnostic data not found for booking id: " + bookingId, "DIAGNOSTIC_NOT_FOUND", "DIAGNOSTIC", "READ", HttpStatus.NOT_FOUND);
    }
}