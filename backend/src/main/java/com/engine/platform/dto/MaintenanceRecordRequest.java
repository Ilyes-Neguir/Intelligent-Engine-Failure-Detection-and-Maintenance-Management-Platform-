package com.engine.platform.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MaintenanceRecordRequest {
    @NotBlank
    private String description;
    private String partsReplaced;
}
