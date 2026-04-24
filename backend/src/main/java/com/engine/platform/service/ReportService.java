package com.engine.platform.service;

import com.engine.platform.exception.AppExceptions;
import com.engine.platform.model.*;
import com.engine.platform.repository.OBDDataRepository;
import com.engine.platform.repository.ReportRepository;
import com.engine.platform.security.SecurityUtils;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfWriter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ReportService {

    private final ReportRepository reportRepository;
    private final BookingService bookingService;
    private final OBDDataRepository obdDataRepository;
    private final SecurityUtils securityUtils;

    @Value("${reports.storage-path:/tmp/reports}")
    private String storagePath;

    public ReportService(ReportRepository reportRepository,
                         BookingService bookingService,
                         OBDDataRepository obdDataRepository,
                         SecurityUtils securityUtils) {
        this.reportRepository = reportRepository;
        this.bookingService = bookingService;
        this.obdDataRepository = obdDataRepository;
        this.securityUtils = securityUtils;
    }

    /**
     * Generate a PDF report for a booking.
     * Only the assigned mechanic can generate the report.
     */
    public Report generateReport(Long bookingId) {
        Booking booking = bookingService.findByIdOrThrow(bookingId);
        User currentUser = securityUtils.getCurrentUser();

        // Only assigned mechanic can generate report
        if (booking.getMechanic() == null || !booking.getMechanic().getId().equals(currentUser.getId())) {
            throw new AppExceptions.ForbiddenException("Only the assigned mechanic can generate a report for this booking");
        }

        List<OBDData> obdDataList = obdDataRepository.findByBookingId(bookingId);

        String fileName = "report_booking_" + bookingId + "_" +
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".pdf";
        String filePath = storagePath + File.separator + fileName;

        // Ensure directory exists
        new File(storagePath).mkdirs();

        try {
            generatePdf(filePath, booking, obdDataList);
        } catch (Exception e) {
            throw new AppExceptions.BadRequestException("Failed to generate report: " + e.getMessage());
        }

        Report report = new Report();
        report.setBooking(booking);
        report.setFileName(fileName);
        report.setFilePath(filePath);
        return reportRepository.save(report);
    }

    /**
     * Get all reports for a booking.
     * Accessible by the booking client or assigned mechanic.
     */
    public List<Report> getReportsByBooking(Long bookingId) {
        Booking booking = bookingService.findByIdOrThrow(bookingId);
        assertBookingAccess(booking);
        return reportRepository.findByBookingId(bookingId);
    }

    /**
     * Download a report file.
     * Accessible by the booking client or assigned mechanic.
     */
    public File downloadReport(Long reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException("Report not found with id: " + reportId));

        assertBookingAccess(report.getBooking());

        File file = new File(report.getFilePath());
        if (!file.exists()) {
            throw new AppExceptions.ResourceNotFoundException("Report file not found on server");
        }
        return file;
    }

    private void assertBookingAccess(Booking booking) {
        User currentUser = securityUtils.getCurrentUser();
        boolean isClient = booking.getClient().getId().equals(currentUser.getId());
        boolean isMechanic = booking.getMechanic() != null
                && booking.getMechanic().getId().equals(currentUser.getId());

        if (!isClient && !isMechanic) {
            throw new AppExceptions.ForbiddenException("Access denied to report for this booking");
        }
    }

    private void generatePdf(String filePath, Booking booking, List<OBDData> obdDataList)
            throws DocumentException, IOException {
        Document document = new Document();
        PdfWriter.getInstance(document, new FileOutputStream(filePath));
        document.open();

        Font titleFont = new Font(Font.FontFamily.HELVETICA, 18, Font.BOLD);
        Font headerFont = new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD);
        Font bodyFont = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL);

        document.add(new Paragraph("Diagnostic Report", titleFont));
        document.add(new Paragraph(" "));
        document.add(new Paragraph("Booking ID: " + booking.getId(), headerFont));
        document.add(new Paragraph("Client: " + booking.getClient().getName(), bodyFont));
        if (booking.getMechanic() != null) {
            document.add(new Paragraph("Mechanic: " + booking.getMechanic().getName(), bodyFont));
        }
        document.add(new Paragraph("Vehicle: " + booking.getVehicle().getMake()
                + " " + booking.getVehicle().getModel()
                + " (" + booking.getVehicle().getYear() + ")", bodyFont));
        document.add(new Paragraph("Status: " + booking.getStatus(), bodyFont));
        document.add(new Paragraph("Generated: "
                + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")), bodyFont));
        document.add(new Paragraph(" "));

        if (obdDataList.isEmpty()) {
            document.add(new Paragraph("No diagnostic readings available.", bodyFont));
        } else {
            document.add(new Paragraph("Diagnostic Readings (" + obdDataList.size() + " total):", headerFont));
            for (OBDData obd : obdDataList) {
                document.add(new Paragraph(" "));
                document.add(new Paragraph("Reading at: " + obd.getTimestamp(), bodyFont));
                document.add(new Paragraph("Fault: " + obd.getFaultLabel()
                        + " (confidence: " + String.format("%.1f%%", obd.getConfidence() != null ? obd.getConfidence() * 100 : 0)
                        + ")", bodyFont));
                document.add(new Paragraph("RPM: " + obd.getRpm()
                        + "  Speed: " + obd.getSpeed()
                        + "  CO: " + obd.getCo()
                        + "  HC: " + obd.getHc(), bodyFont));
            }
        }

        document.close();
    }
}
