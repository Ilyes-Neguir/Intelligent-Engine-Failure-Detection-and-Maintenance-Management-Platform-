package com.pfe.backend.exception;

import org.springframework.http.HttpStatus;

public class VehicleOwnershipException extends DomainException {
    public VehicleOwnershipException(String message) {
        super(message, "VEHICLE_OWNERSHIP_VIOLATION", "VEHICLE", "ACCESS", HttpStatus.FORBIDDEN);
    }
}