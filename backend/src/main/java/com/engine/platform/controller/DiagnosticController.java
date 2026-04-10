package com.engine.platform.controller;

import com.engine.platform.dto.OBDDataDTO;
import com.engine.platform.model.OBDData;
import com.engine.platform.service.DiagnosticService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Diagnostic endpoints (MECHANIC role required).
 *
 * mechanicId is NEVER accepted from the path — it is always derived from JWT via SecurityUtils.
 */
@RestController
@RequestMapping("/api/diagnostic")
@PreAuthorize("hasAuthority('MECHANIC')")
public class DiagnosticController {

    private final DiagnosticService diagnosticService;

    public DiagnosticController(DiagnosticService diagnosticService) {
        this.diagnosticService = diagnosticService;
    }

    /**
     * Submit an OBD reading for a booking.
     * The calling mechanic must be assigned to the booking (verified from JWT).
     */
    @PostMapping("/booking/{bookingId}")
    public ResponseEntity<OBDData> saveDiagnostic(@PathVariable Long bookingId,
                                                   @Valid @RequestBody OBDDataDTO dto) {
        return ResponseEntity.ok(diagnosticService.saveDiagnostic(bookingId, dto));
    }

    /**
     * Get all diagnostic readings for a booking.
     * Accessible by the assigned mechanic or the booking client.
     */
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<OBDData>> getDiagnosticsByBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(diagnosticService.getDiagnosticsByBooking(bookingId));
    }
}
