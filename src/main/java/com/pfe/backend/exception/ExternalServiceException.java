package com.pfe.backend.exception;

import org.springframework.http.HttpStatus;

public class ExternalServiceException extends DomainException {
  public ExternalServiceException(String message) {
    super(message, "EXTERNAL_SERVICE_ERROR", "ML", "CALL", HttpStatus.BAD_GATEWAY);
  }
}