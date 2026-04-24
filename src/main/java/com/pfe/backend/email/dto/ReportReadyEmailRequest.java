package com.pfe.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReportReadyEmailRequest {

    @Email(message = "Invalid email format")
    @NotBlank(message = "Recipient email is required")
    private String to;

    @NotBlank(message = "Client name is required")
    private String clientName;

    @NotNull(message = "Booking id is required")
    private Long bookingId;
}