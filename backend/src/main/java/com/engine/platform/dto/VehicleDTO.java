package com.engine.platform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class VehicleDTO {
    @NotBlank
    private String make;

    @NotBlank
    private String model;

    @NotNull
    @Positive
    private Integer year;

    @NotBlank
    private String licensePlate;
}
