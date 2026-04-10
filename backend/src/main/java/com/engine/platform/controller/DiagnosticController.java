package com.engine.platform.controller;

import com.engine.platform.dto.OBDDataDTO;
import com.engine.platform.entity.OBDData;
import com.engine.platform.entity.User;
import com.engine.platform.security.SecurityUtils;
import com.engine.platform.service.DiagnosticService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Diagnostic endpoints — mechanic identity from JWT, not from URL.
 *
 * POST /api/diagnostic/booking/{bookingId}  → only assigned MECHANIC submits
 * GET  /api/diagnostic/booking/{bookingId}  → booking client or assigned mechanic
 */
@RestController
@RequestMapping("/api/diagnostic")
@RequiredArgsConstructor
public class DiagnosticController {

    private final DiagnosticService diagnosticService;

    @PostMapping("/booking/{bookingId}")
    @PreAuthorize("hasAuthority('MECHANIC')")
    public ResponseEntity<OBDData> submitDiagnostic(
            @PathVariable Long bookingId,
            @Valid @RequestBody OBDDataDTO dto) {
        User mechanic = SecurityUtils.getCurrentUser();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(diagnosticService.saveDiagnostic(bookingId, dto, mechanic));
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<OBDData> getDiagnostic(@PathVariable Long bookingId) {
        User user = SecurityUtils.getCurrentUser();
        return ResponseEntity.ok(diagnosticService.getDiagnostic(bookingId, user));
    }
}
