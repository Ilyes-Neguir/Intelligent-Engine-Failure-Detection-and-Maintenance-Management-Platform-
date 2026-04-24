package com.pfe.backend.exception;

import org.springframework.http.HttpStatus;

public abstract class DomainException extends RuntimeException {
    private final String errorCode;
    private final String entity;
    private final String action;
    private final HttpStatus status;

    protected DomainException(String message, String errorCode, String entity, String action, HttpStatus status) {
        super(message);
        this.errorCode = errorCode;
        this.entity = entity;
        this.action = action;
        this.status = status;
    }

    public String getErrorCode() { return errorCode; }
    public String getEntity() { return entity; }
    public String getAction() { return action; }
    public HttpStatus getStatus() { return status; }
}