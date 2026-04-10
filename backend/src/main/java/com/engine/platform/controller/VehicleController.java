package com.engine.platform.controller;

import com.engine.platform.dto.VehicleRequest;
import com.engine.platform.entity.User;
import com.engine.platform.entity.Vehicle;
import com.engine.platform.security.SecurityUtils;
import com.engine.platform.service.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Vehicle endpoints — no userId in URL; identity comes from JWT.
 *
 * POST   /api/vehicles         → authenticated CLIENT creates vehicle
 * GET    /api/vehicles/my      → list owned vehicles
 * GET    /api/vehicles/{id}    → owner only
 * PUT    /api/vehicles/{id}    → owner only
 * DELETE /api/vehicles/{id}    → owner only
 */
@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    @PostMapping
    @PreAuthorize("hasAuthority('CLIENT')")
    public ResponseEntity<Vehicle> create(@Valid @RequestBody VehicleRequest request) {
        User owner = SecurityUtils.getCurrentUser();
        return ResponseEntity.status(HttpStatus.CREATED).body(vehicleService.create(request, owner));
    }

    @GetMapping("/my")
    public ResponseEntity<List<Vehicle>> listMyVehicles() {
        return ResponseEntity.ok(vehicleService.getMyVehicles());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Vehicle> getById(@PathVariable Long id) {
        return ResponseEntity.ok(vehicleService.getById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('CLIENT')")
    public ResponseEntity<Vehicle> update(@PathVariable Long id,
                                          @Valid @RequestBody VehicleRequest request) {
        return ResponseEntity.ok(vehicleService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('CLIENT')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        vehicleService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
