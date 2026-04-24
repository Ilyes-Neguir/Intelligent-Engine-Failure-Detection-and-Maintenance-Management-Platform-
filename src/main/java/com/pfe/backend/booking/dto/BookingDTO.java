package com.pfe.backend.booking.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BookingDTO {
    private Long clientId;

    @NotNull(message = "Vehicle ID is required")
    private Long vehicleId;

    @NotNull(message = "Scheduled time is required")
    private LocalDateTime scheduledTime;

    private String description;
}