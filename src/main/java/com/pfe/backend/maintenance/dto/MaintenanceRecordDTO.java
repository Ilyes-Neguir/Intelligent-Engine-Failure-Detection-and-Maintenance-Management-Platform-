package com.pfe.backend.maintenance.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
public class MaintenanceRecordDTO {
    @NotBlank(message = "Intervention description is required")
    private String intervention;

    @NotBlank(message = "Notes are required")
    private String notes;

    private String partsReplaced;

    @NotNull(message = "Cost is required")
    private Double cost;
}