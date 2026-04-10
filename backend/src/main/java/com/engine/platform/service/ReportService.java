package com.engine.platform.service;

import com.engine.platform.entity.Booking;
import com.engine.platform.entity.OBDData;
import com.engine.platform.entity.Report;
import com.engine.platform.entity.User;
import com.engine.platform.exception.AppExceptions;
import com.engine.platform.repository.OBDDataRepository;
import com.engine.platform.repository.ReportRepository;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final OBDDataRepository obdDataRepository;
    private final BookingService bookingService;

    @Value("${report.storage-path}")
    private String storagePath;

    /**
     * Generate a PDF report for a booking.
     * Accessible by both the booking client and assigned mechanic.
     */
    public Report generateReport(Long bookingId, User currentUser) {
        Booking booking = bookingService.getBookingById(bookingId);
        assertClientOrMechanic(booking, currentUser);

        if (reportRepository.existsByBookingId(bookingId)) {
            throw new AppExceptions.ConflictException(
                    "Report already generated for booking id: " + bookingId);
        }

        // Fetch diagnostic data (optional — report can be generated without it)
        OBDData obdData = obdDataRepository.findByBookingId(bookingId).orElse(null);

        // Create storage directory
        File dir = new File(storagePath);
        if (!dir.exists() && !dir.mkdirs()) {
            throw new AppExceptions.BadRequestException("Cannot create report storage directory");
        }

        String fileName = "report_booking_" + bookingId + "_"
                + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"))
                + ".pdf";
        String filePath = storagePath + File.separator + fileName;

        generatePdf(filePath, booking, obdData);

        Report report = new Report();
        report.setBooking(booking);
        report.setFileName(fileName);
        report.setFilePath(filePath);
        return reportRepository.save(report);
    }

    /**
     * Get the report metadata for a booking.
     * Accessible by both the booking client and assigned mechanic.
     */
    public Report getReportByBooking(Long bookingId, User currentUser) {
        Booking booking = bookingService.getBookingById(bookingId);
        assertClientOrMechanic(booking, currentUser);
        return reportRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                        "Report not found for booking id: " + bookingId));
    }

    /**
     * Download a report file by report ID.
     * Accessible by both the booking client and assigned mechanic.
     */
    public Resource downloadReport(Long reportId, User currentUser) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                        "Report not found with id: " + reportId));

        Booking booking = report.getBooking();
        assertClientOrMechanic(booking, currentUser);

        try {
            Path path = Paths.get(report.getFilePath());
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new AppExceptions.ResourceNotFoundException("Report file not found on disk");
            }
            return resource;
        } catch (IOException e) {
            throw new AppExceptions.BadRequestException("Could not read report file: " + e.getMessage());
        }
    }

    // ---- internal helpers ----

    private void assertClientOrMechanic(Booking booking, User user) {
        boolean isClient = booking.getClient().getId().equals(user.getId());
        boolean isMechanic = booking.getMechanic() != null
                && booking.getMechanic().getId().equals(user.getId());
        if (!isClient && !isMechanic) {
            throw new AppExceptions.ForbiddenException(
                    "Access denied: not the booking client or assigned mechanic");
        }
    }

    private void generatePdf(String filePath, Booking booking, OBDData obdData) {
        Document document = new Document();
        try {
            PdfWriter.getInstance(document, new FileOutputStream(filePath));
            document.open();

            Font titleFont = new Font(Font.FontFamily.HELVETICA, 18, Font.BOLD);
            Font headerFont = new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD);
            Font normalFont = new Font(Font.FontFamily.HELVETICA, 11);

            document.add(new Paragraph("Diagnostic Report", titleFont));
            document.add(new Paragraph(" "));
            document.add(new Paragraph("Booking ID: " + booking.getId(), headerFont));
            document.add(new Paragraph("Status: " + booking.getStatus(), normalFont));
            document.add(new Paragraph("Client: " + booking.getClient().getFullName(), normalFont));
            if (booking.getMechanic() != null) {
                document.add(new Paragraph("Mechanic: " + booking.getMechanic().getFullName(), normalFont));
            }
            document.add(new Paragraph("Vehicle: " + booking.getVehicle().getMake()
                    + " " + booking.getVehicle().getModel()
                    + " (" + booking.getVehicle().getYear() + ")", normalFont));
            document.add(new Paragraph("License Plate: " + booking.getVehicle().getLicensePlate(), normalFont));
            if (booking.getDescription() != null) {
                document.add(new Paragraph("Description: " + booking.getDescription(), normalFont));
            }
            document.add(new Paragraph("Generated: " + LocalDateTime.now(), normalFont));
            document.add(new Paragraph(" "));

            if (obdData != null) {
                document.add(new Paragraph("Diagnostic Results", headerFont));
                document.add(new Paragraph("Predicted Fault: " + obdData.getFaultDescription(), normalFont));
                document.add(new Paragraph("Confidence: " + String.format("%.2f%%", obdData.getConfidence()), normalFont));
                document.add(new Paragraph(" "));
                document.add(new Paragraph("OBD Sensor Readings", headerFont));
                document.add(new Paragraph("MAP: " + obdData.getMap(), normalFont));
                document.add(new Paragraph("TPS: " + obdData.getTps(), normalFont));
                document.add(new Paragraph("RPM: " + obdData.getRpm(), normalFont));
                document.add(new Paragraph("Speed: " + obdData.getSpeed(), normalFont));
                document.add(new Paragraph("CO: " + obdData.getCo(), normalFont));
                document.add(new Paragraph("HC: " + obdData.getHc(), normalFont));
                document.add(new Paragraph("CO2: " + obdData.getCo2(), normalFont));
                document.add(new Paragraph("O2: " + obdData.getO2(), normalFont));
                document.add(new Paragraph("Lambda: " + obdData.getLambda(), normalFont));
                document.add(new Paragraph("AFR: " + obdData.getAfr(), normalFont));
            } else {
                document.add(new Paragraph("No diagnostic data available for this booking.", normalFont));
            }

        } catch (DocumentException | IOException e) {
            throw new AppExceptions.BadRequestException("Failed to generate PDF: " + e.getMessage());
        } finally {
            document.close();
        }
    }
}
