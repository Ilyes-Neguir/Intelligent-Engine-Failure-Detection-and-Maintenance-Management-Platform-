package com.engine.platform.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BookingRequest {
    @NotNull
    private Long vehicleId;
    private String notes;
}
