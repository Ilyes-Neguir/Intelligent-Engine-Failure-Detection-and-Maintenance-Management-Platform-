package com.pfe.backend.controller;

import com.pfe.backend.maintenance.dto.MaintenanceRecordDTO;
import com.pfe.backend.maintenance.MaintenanceRecord;
import com.pfe.backend.maintenance.MaintenanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/maintenance")
@RequiredArgsConstructor
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    @PostMapping("/booking/{bookingId}")
    @PreAuthorize("hasAuthority('MECHANIC')")
    public ResponseEntity<MaintenanceRecord> logMaintenance(
            Authentication authentication,
            @PathVariable Long bookingId,
            @Valid @RequestBody MaintenanceRecordDTO dto) {
        return ResponseEntity.ok(maintenanceService.createRecordDto(bookingId, dto, authentication));
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<MaintenanceRecord>> getBookingMaintenance(
            Authentication authentication,
            @PathVariable Long bookingId) {
        return ResponseEntity.ok(maintenanceService.getRecordsByBookingForCurrentUser(bookingId, authentication));
    }

    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<List<MaintenanceRecord>> getVehicleMaintenance(
            Authentication authentication,
            @PathVariable Long vehicleId) {
        return ResponseEntity.ok(maintenanceService.getRecordsByVehicleForCurrentUser(vehicleId, authentication));
    }
}