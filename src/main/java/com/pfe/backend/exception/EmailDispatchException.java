package com.pfe.backend.exception;

import org.springframework.http.HttpStatus;

public class EmailDispatchException extends DomainException {
    public EmailDispatchException(String action, String message, HttpStatus status) {
        super(message, "EMAIL_DISPATCH_ERROR", "EMAIL", action, status);
    }

    public static EmailDispatchException unauthorized(String message) {
        return new EmailDispatchException("AUTHORIZE", message, HttpStatus.FORBIDDEN);
    }

    public static EmailDispatchException invalidRequest(String message) {
        return new EmailDispatchException("VALIDATE", message, HttpStatus.BAD_REQUEST);
    }

    public static EmailDispatchException deliveryFailed(String message) {
        return new EmailDispatchException("SEND", message, HttpStatus.BAD_GATEWAY);
    }
}