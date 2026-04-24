package com.pfe.backend.exception;

import org.springframework.http.HttpStatus;

public class InvalidPredictionException extends DomainException {
    public InvalidPredictionException(String message) {
        super(message, "DIAGNOSTIC_INVALID_PREDICTION", "DIAGNOSTIC", "ML_CALL", HttpStatus.BAD_REQUEST);
    }
}