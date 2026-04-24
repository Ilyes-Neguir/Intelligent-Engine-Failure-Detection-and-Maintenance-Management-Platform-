package com.pfe.backend.vehicle;

import com.pfe.backend.vehicle.dto.VehicleResponseDTO;
import org.springframework.stereotype.Component;

@Component
public class VehicleMapper {

    public VehicleResponseDTO toDto(Vehicle vehicle) {
        return VehicleResponseDTO.builder()
                .id(vehicle.getId())
                .ownerId(vehicle.getOwner() != null ? vehicle.getOwner().getId() : null)
                .make(vehicle.getMake())
                .model(vehicle.getModel())
                .year(vehicle.getYear())
                .vin(vehicle.getVin())
                .licensePlate(vehicle.getLicensePlate())
                .engineType(vehicle.getEngineType())
                .mileage(vehicle.getMileage())
                .build();
    }
}