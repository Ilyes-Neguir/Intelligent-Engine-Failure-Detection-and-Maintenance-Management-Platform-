package com.engine.platform.controller;

import com.engine.platform.model.Report;
import com.engine.platform.service.ReportService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.util.List;

/**
 * Report endpoints.
 *
 * All access is controlled by JWT identity — no user IDs accepted from path for authorization.
 * - Generate: only the assigned mechanic can generate a report.
 * - Get/Download: booking client or assigned mechanic can access.
 */
@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    /** Generate a report for a booking (assigned mechanic only). */
    @PostMapping("/booking/{bookingId}/generate")
    public ResponseEntity<Report> generateReport(@PathVariable Long bookingId) {
        return ResponseEntity.ok(reportService.generateReport(bookingId));
    }

    /** Get all reports for a booking (booking client or assigned mechanic). */
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<Report>> getReportsByBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(reportService.getReportsByBooking(bookingId));
    }

    /** Download a report file (booking client or assigned mechanic). */
    @GetMapping("/{reportId}/download")
    public ResponseEntity<FileSystemResource> downloadReport(@PathVariable Long reportId) {
        File file = reportService.downloadReport(reportId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(new FileSystemResource(file));
    }
}
