package com.pfe.backend.exception;

import org.springframework.http.HttpStatus;

public class VehicleNotFoundException extends DomainException {
    public VehicleNotFoundException(Long id) {
        super("Vehicle not found with id: " + id, "VEHICLE_NOT_FOUND", "VEHICLE", "READ", HttpStatus.NOT_FOUND);
    }
}