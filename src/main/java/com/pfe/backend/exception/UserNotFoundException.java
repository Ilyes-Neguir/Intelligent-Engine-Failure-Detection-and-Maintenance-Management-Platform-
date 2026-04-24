package com.pfe.backend.exception;

import org.springframework.http.HttpStatus;

public class UserNotFoundException extends DomainException {
    public UserNotFoundException(Long id) {
        super("User not found with id: " + id, "USER_NOT_FOUND", "USER", "READ", HttpStatus.NOT_FOUND);
    }
}