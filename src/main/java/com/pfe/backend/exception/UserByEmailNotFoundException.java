package com.pfe.backend.exception;

import org.springframework.http.HttpStatus;

public class UserByEmailNotFoundException extends DomainException {
    public UserByEmailNotFoundException(String email) {
        super("User not found with email: " + email, "USER_EMAIL_NOT_FOUND", "USER", "READ", HttpStatus.NOT_FOUND);
    }
}