package com.pfe.backend.booking.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CompleteBookingRequest {

    @NotBlank(message = "notes is required")
    private String notes;
}