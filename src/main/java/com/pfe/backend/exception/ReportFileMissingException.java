package com.pfe.backend.exception;

import org.springframework.http.HttpStatus;

public class ReportFileMissingException extends DomainException {
    public ReportFileMissingException(String message) {
        super(message, "REPORT_FILE_MISSING", "REPORT", "DOWNLOAD", HttpStatus.NOT_FOUND);
    }
}