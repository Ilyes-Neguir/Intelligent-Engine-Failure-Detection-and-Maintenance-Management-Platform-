package com.pfe.backend.report.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReportResponseDTO {
    private Long id;
    private Long bookingId;
    private String filePath;
    private LocalDateTime createdAt;
}