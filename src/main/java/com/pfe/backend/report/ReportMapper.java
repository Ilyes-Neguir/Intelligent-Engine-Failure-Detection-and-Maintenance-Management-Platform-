package com.pfe.backend.report;

import com.pfe.backend.report.dto.ReportResponseDTO;
import org.springframework.stereotype.Component;

@Component
public class ReportMapper {

    public ReportResponseDTO toDto(Report r) {
        return ReportResponseDTO.builder()
                .id(r.getId())
                .bookingId(r.getBooking() != null ? r.getBooking().getId() : null)
                .filePath(r.getFilePath())
                .createdAt(r.getCreatedAt())
                .build();
    }
}