package com.engine.platform.controller;

import com.engine.platform.dto.MaintenanceRecordRequest;
import com.engine.platform.model.MaintenanceRecord;
import com.engine.platform.service.MaintenanceService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Maintenance record endpoints.
 *
 * mechanicId is NEVER accepted from path — always derived from JWT via SecurityUtils.
 */
@RestController
@RequestMapping("/api/maintenance")
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    public MaintenanceController(MaintenanceService maintenanceService) {
        this.maintenanceService = maintenanceService;
    }

    /** Create a maintenance record (assigned mechanic only). */
    @PostMapping("/booking/{bookingId}")
    @PreAuthorize("hasAuthority('MECHANIC')")
    public ResponseEntity<MaintenanceRecord> createRecord(@PathVariable Long bookingId,
                                                           @Valid @RequestBody MaintenanceRecordRequest request) {
        return ResponseEntity.ok(maintenanceService.createRecord(bookingId, request));
    }

    /** Get maintenance records for a booking (booking client or assigned mechanic). */
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<MaintenanceRecord>> getRecordsByBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(maintenanceService.getRecordsByBooking(bookingId));
    }
}
