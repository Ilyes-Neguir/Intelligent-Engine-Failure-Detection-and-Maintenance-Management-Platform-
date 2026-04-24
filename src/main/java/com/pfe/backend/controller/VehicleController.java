package com.pfe.backend.controller;

import com.pfe.backend.vehicle.dto.VehicleDTO;
import com.pfe.backend.vehicle.dto.VehicleResponseDTO;
import com.pfe.backend.vehicle.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    @PostMapping
    public ResponseEntity<VehicleResponseDTO> createVehicle(
            Authentication authentication,
            @Valid @RequestBody VehicleDTO dto) {
        return ResponseEntity.ok(vehicleService.createVehicleDto(dto, authentication));
    }

    @GetMapping("/my")
    public ResponseEntity<List<VehicleResponseDTO>> getMyVehicles(Authentication authentication) {
        return ResponseEntity.ok(vehicleService.getMyVehiclesDto(authentication));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehicleResponseDTO> getVehicle(
            Authentication authentication,
            @PathVariable Long id) {
        return ResponseEntity.ok(vehicleService.getVehicleDto(id, authentication));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VehicleResponseDTO> updateVehicle(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody VehicleDTO dto) {
        return ResponseEntity.ok(vehicleService.updateVehicleDto(id, dto, authentication));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVehicle(
            Authentication authentication,
            @PathVariable Long id) {
        vehicleService.deleteVehicle(id, authentication);
        return ResponseEntity.noContent().build();
    }
}