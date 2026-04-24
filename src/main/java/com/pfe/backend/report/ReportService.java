package com.pfe.backend.report;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.pfe.backend.booking.Booking;
import com.pfe.backend.booking.BookingRepository;
import com.pfe.backend.report.dto.ReportResponseDTO;
import com.pfe.backend.exception.BookingNotFoundException;
import com.pfe.backend.exception.ForbiddenOperationException;
import com.pfe.backend.exception.ReportFileMissingException;
import com.pfe.backend.exception.ReportNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final BookingRepository bookingRepository;
    private final ReportMapper reportMapper;

    @Value("${reports.directory:./reports}")
    private String reportsDirectory;

    public ReportResponseDTO generateReportDto(Long bookingId, Authentication authentication) throws IOException {
        return reportMapper.toDto(generateReport(bookingId, authentication));
    }

    public ReportResponseDTO getReportByBookingIdDto(Long bookingId, Authentication authentication) {
        return reportMapper.toDto(getReportByBookingId(bookingId, authentication));
    }

    public Report generateReport(Long bookingId, Authentication authentication) throws IOException {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException(bookingId));

        assertClientOrAssignedMechanic(booking, authentication);

        File directory = new File(reportsDirectory);
        if (!directory.exists() && !directory.mkdirs()) {
            throw new IOException("Failed to create reports directory.");
        }

        String fileName = "report_" + bookingId + "_" + System.currentTimeMillis() + ".pdf";
        String filePath = reportsDirectory + "/" + fileName;

        PdfWriter writer = new PdfWriter(filePath);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);
        document.add(new Paragraph("Diagnostic Report for Booking #" + bookingId));
        document.close();

        Report report = new Report();
        report.setBooking(booking);
        report.setFilePath(filePath);
        report.setFileName(fileName);
        return reportRepository.save(report);
    }

    public Report getReportByBookingId(Long bookingId, Authentication authentication) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException(bookingId));

        assertClientOrAssignedMechanic(booking, authentication);

        return reportRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new ReportNotFoundException("Report not found for booking id: " + bookingId));
    }

    public File getReportFile(Long reportId, Authentication authentication) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ReportNotFoundException("Report not found with id: " + reportId));

        assertClientOrAssignedMechanic(report.getBooking(), authentication);

        File file = new File(report.getFilePath());
        if (!file.exists()) {
            throw new ReportFileMissingException("Report file missing on server disk: " + report.getFilePath());
        }
        return file;
    }

    private void assertClientOrAssignedMechanic(Booking booking, Authentication authentication) {
        String currentEmail = authentication.getName();

        boolean isClient = booking.getClient() != null && booking.getClient().getEmail().equals(currentEmail);
        boolean isMechanic = booking.getMechanic() != null && booking.getMechanic().getEmail().equals(currentEmail);

        if (!isClient && !isMechanic) {
            throw new ForbiddenOperationException("REPORT", "ACCESS",
                    "Access denied: you are neither booking owner nor assigned mechanic.");
        }
    }
}