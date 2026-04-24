package com.pfe.backend.exception;

import org.springframework.http.HttpStatus;

public class DuplicateEmailException extends DomainException {
    public DuplicateEmailException(String email) {
        super("Email already exists: " + email, "USER_DUPLICATE_EMAIL", "USER", "CREATE", HttpStatus.CONFLICT);
    }
}