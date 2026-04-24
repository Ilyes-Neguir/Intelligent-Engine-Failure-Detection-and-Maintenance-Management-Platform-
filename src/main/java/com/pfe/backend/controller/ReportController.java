package com.pfe.backend.controller;

import com.pfe.backend.report.dto.ReportResponseDTO;
import com.pfe.backend.report.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.IOException;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping("/booking/{bookingId}")
    public ResponseEntity<ReportResponseDTO> generateReport(Authentication authentication,
                                                            @PathVariable Long bookingId) throws IOException {
        return ResponseEntity.ok(reportService.generateReportDto(bookingId, authentication));
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<ReportResponseDTO> getReport(Authentication authentication,
                                                       @PathVariable Long bookingId) {
        return ResponseEntity.ok(reportService.getReportByBookingIdDto(bookingId, authentication));
    }

    @GetMapping("/download/{reportId}")
    public ResponseEntity<FileSystemResource> downloadReport(Authentication authentication,
                                                             @PathVariable Long reportId) {
        File file = reportService.getReportFile(reportId, authentication);
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + file.getName());
        return ResponseEntity.ok()
                .headers(headers)
                .contentLength(file.length())
                .contentType(MediaType.APPLICATION_PDF)
                .body(new FileSystemResource(file));
    }
}