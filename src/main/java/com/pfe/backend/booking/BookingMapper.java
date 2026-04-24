package com.pfe.backend.booking;

import com.pfe.backend.booking.dto.BookingResponseDTO;
import org.springframework.stereotype.Component;

@Component
public class BookingMapper {

    public BookingResponseDTO toDto(Booking b) {
        return BookingResponseDTO.builder()
                .id(b.getId())
                .clientId(b.getClient() != null ? b.getClient().getId() : null)
                .mechanicId(b.getMechanic() != null ? b.getMechanic().getId() : null)
                .vehicleId(b.getVehicle() != null ? b.getVehicle().getId() : null)
                .scheduledTime(b.getScheduledTime())
                .status(b.getStatus())
                .description(b.getDescription())
                .mechanicNotes(b.getMechanicNotes())
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .build();
    }
}