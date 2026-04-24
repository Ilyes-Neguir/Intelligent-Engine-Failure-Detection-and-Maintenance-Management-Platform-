package com.pfe.backend.exception;

import org.springframework.http.HttpStatus;

public class DuplicateVinException extends DomainException {
    public DuplicateVinException(String vin) {
        super("Vehicle with VIN already exists: " + vin, "VEHICLE_DUPLICATE_VIN", "VEHICLE", "CREATE", HttpStatus.CONFLICT);
    }
}