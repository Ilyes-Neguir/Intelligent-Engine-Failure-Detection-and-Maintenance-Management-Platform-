package com.pfe.backend.exception;

import org.springframework.http.HttpStatus;

public class ReportNotFoundException extends DomainException {
    public ReportNotFoundException(String message) {
        super(message, "REPORT_NOT_FOUND", "REPORT", "READ", HttpStatus.NOT_FOUND);
    }
}