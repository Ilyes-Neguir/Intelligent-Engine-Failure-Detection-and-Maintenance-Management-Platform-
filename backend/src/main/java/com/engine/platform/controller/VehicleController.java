package com.engine.platform.controller;

import com.engine.platform.dto.VehicleDTO;
import com.engine.platform.model.Vehicle;
import com.engine.platform.service.VehicleService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Vehicle endpoints.
 * ownerId is NEVER accepted from the path or request body for mutations —
 * it is always derived from the JWT token via SecurityUtils.
 */
@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    /** Create a vehicle for the currently authenticated user. */
    @PostMapping
    public ResponseEntity<Vehicle> createVehicle(@Valid @RequestBody VehicleDTO dto) {
        return ResponseEntity.ok(vehicleService.createVehicle(dto));
    }

    /** Update a vehicle. Only the owner (from JWT) can update. */
    @PutMapping("/{vehicleId}")
    public ResponseEntity<Vehicle> updateVehicle(@PathVariable Long vehicleId,
                                                  @Valid @RequestBody VehicleDTO dto) {
        return ResponseEntity.ok(vehicleService.updateVehicle(vehicleId, dto));
    }

    /** Delete a vehicle. Only the owner (from JWT) can delete. */
    @DeleteMapping("/{vehicleId}")
    public ResponseEntity<Void> deleteVehicle(@PathVariable Long vehicleId) {
        vehicleService.deleteVehicle(vehicleId);
        return ResponseEntity.noContent().build();
    }

    /** List vehicles owned by the currently authenticated user. */
    @GetMapping("/my")
    public ResponseEntity<List<Vehicle>> getMyVehicles() {
        return ResponseEntity.ok(vehicleService.getMyVehicles());
    }

    /** Get a specific vehicle by id. */
    @GetMapping("/{vehicleId}")
    public ResponseEntity<Vehicle> getVehicleById(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(vehicleService.getVehicleById(vehicleId));
    }
}
