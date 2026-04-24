package com.pfe.backend.vehicle.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VehicleResponseDTO {
    private Long id;
    private Long ownerId;
    private String make;
    private String model;
    private Integer year;
    private String vin;
    private String licensePlate;
    private String engineType;
    private Integer mileage;
}