package com.pfe.backend.booking.dto;

import com.pfe.backend.booking.BookingStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BookingResponseDTO {
    private Long id;
    private Long clientId;
    private Long mechanicId;
    private Long vehicleId;
    private LocalDateTime scheduledTime;
    private BookingStatus status;
    private String description;
    private String mechanicNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}