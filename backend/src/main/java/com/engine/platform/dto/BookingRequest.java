package com.engine.platform.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BookingRequest {

    @NotNull(message = "Vehicle ID is required")
    private Long vehicleId;

    private String description;

    private LocalDateTime scheduledAt;
}
