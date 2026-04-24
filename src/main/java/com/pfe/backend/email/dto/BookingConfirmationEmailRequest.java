package com.pfe.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BookingConfirmationEmailRequest {

    @Email(message = "Invalid email format")
    @NotBlank(message = "Recipient email is required")
    private String to;

    @NotBlank(message = "Client name is required")
    private String clientName;

    @NotBlank(message = "Scheduled time is required")
    private String scheduledTime;
}