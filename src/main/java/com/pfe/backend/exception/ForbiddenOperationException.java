package com.pfe.backend.exception;

import org.springframework.http.HttpStatus;

public class ForbiddenOperationException extends DomainException {
    public ForbiddenOperationException(String entity, String action, String message) {
        super(message, "AUTH_FORBIDDEN", entity, action, HttpStatus.FORBIDDEN);
    }
}