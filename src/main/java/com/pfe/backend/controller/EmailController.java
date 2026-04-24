package com.pfe.backend.controller;

import com.pfe.backend.dto.BookingConfirmationEmailRequest;
import com.pfe.backend.dto.ReportReadyEmailRequest;
import com.pfe.backend.email.EmailFacadeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/emails")
@RequiredArgsConstructor
public class EmailController {

    private final EmailFacadeService emailFacadeService;

    @PostMapping("/booking-confirmation")
    public ResponseEntity<Void> sendBookingConfirmation(
            Authentication authentication,
            @Valid @RequestBody BookingConfirmationEmailRequest request) {
        emailFacadeService.sendBookingConfirmationEmail(request, authentication);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/report-ready")
    public ResponseEntity<Void> sendReportReady(
            Authentication authentication,
            @Valid @RequestBody ReportReadyEmailRequest request) {
        emailFacadeService.sendReportReadyEmail(request, authentication);
        return ResponseEntity.ok().build();
    }
}