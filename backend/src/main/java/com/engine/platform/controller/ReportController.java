package com.engine.platform.controller;

import com.engine.platform.entity.Report;
import com.engine.platform.entity.User;
import com.engine.platform.security.SecurityUtils;
import com.engine.platform.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Report endpoints — BOTH policy: booking client and assigned mechanic can access.
 * No user IDs in URL; identity from JWT.
 *
 * POST /api/reports/booking/{bookingId}          → generate report
 * GET  /api/reports/booking/{bookingId}          → get report metadata
 * GET  /api/reports/{id}/download                → download PDF
 */
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping("/booking/{bookingId}")
    public ResponseEntity<Report> generate(@PathVariable Long bookingId) {
        User user = SecurityUtils.getCurrentUser();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reportService.generateReport(bookingId, user));
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<Report> getByBooking(@PathVariable Long bookingId) {
        User user = SecurityUtils.getCurrentUser();
        return ResponseEntity.ok(reportService.getReportByBooking(bookingId, user));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable Long id) {
        User user = SecurityUtils.getCurrentUser();
        Resource resource = reportService.downloadReport(id, user);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}
