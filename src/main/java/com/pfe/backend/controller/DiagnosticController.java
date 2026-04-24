package com.pfe.backend.controller;

import com.pfe.backend.diagnostic.DiagnosticService;
import com.pfe.backend.diagnostic.dto.OBDDataDTO;
import com.pfe.backend.diagnostic.dto.OBDDataResponseDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/api/diagnostic")
@RequiredArgsConstructor
public class DiagnosticController {

    private final DiagnosticService diagnosticService;

    @PostMapping("/booking/{bookingId}")
    public ResponseEntity<OBDDataResponseDTO> saveDiagnostic(
            Authentication authentication,
            @PathVariable Long bookingId,
            @Valid @RequestBody OBDDataDTO dto) throws IOException {
        return ResponseEntity.ok(diagnosticService.saveDiagnosticDto(bookingId, dto, authentication));
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<OBDDataResponseDTO> getDiagnostic(
            Authentication authentication,
            @PathVariable Long bookingId) {
        return ResponseEntity.ok(diagnosticService.getDiagnosticByBookingIdDto(bookingId, authentication));
    }
}