package com.engine.platform.service;

import com.engine.platform.dto.MaintenanceRecordRequest;
import com.engine.platform.exception.AppExceptions;
import com.engine.platform.model.Booking;
import com.engine.platform.model.BookingStatus;
import com.engine.platform.model.MaintenanceRecord;
import com.engine.platform.model.User;
import com.engine.platform.repository.MaintenanceRecordRepository;
import com.engine.platform.security.SecurityUtils;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MaintenanceService {

    private final MaintenanceRecordRepository maintenanceRecordRepository;
    private final BookingService bookingService;
    private final SecurityUtils securityUtils;

    public MaintenanceService(MaintenanceRecordRepository maintenanceRecordRepository,
                               BookingService bookingService,
                               SecurityUtils securityUtils) {
        this.maintenanceRecordRepository = maintenanceRecordRepository;
        this.bookingService = bookingService;
        this.securityUtils = securityUtils;
    }

    /**
     * Create a maintenance record for a booking.
     * mechanicId is derived from JWT; only the assigned mechanic can create records.
     */
    public MaintenanceRecord createRecord(Long bookingId, MaintenanceRecordRequest request) {
        User currentMechanic = securityUtils.getCurrentUser();
        Booking booking = bookingService.findByIdOrThrow(bookingId);

        // Only the assigned mechanic can create maintenance records
        if (booking.getMechanic() == null || !booking.getMechanic().getId().equals(currentMechanic.getId())) {
            throw new AppExceptions.ForbiddenException(
                    "You are not the assigned mechanic for booking " + bookingId);
        }

        // Booking must be in progress or completed
        if (booking.getStatus() != BookingStatus.IN_PROGRESS
                && booking.getStatus() != BookingStatus.COMPLETED) {
            throw new AppExceptions.BadRequestException(
                    "Maintenance records can only be created for IN_PROGRESS or COMPLETED bookings; "
                    + "current status: " + booking.getStatus());
        }

        MaintenanceRecord record = new MaintenanceRecord();
        record.setBooking(booking);
        record.setMechanic(currentMechanic);
        record.setDescription(request.getDescription());
        record.setPartsReplaced(request.getPartsReplaced());
        return maintenanceRecordRepository.save(record);
    }

    /**
     * Get maintenance records for a booking.
     * Accessible by the booking client or assigned mechanic.
     */
    public List<MaintenanceRecord> getRecordsByBooking(Long bookingId) {
        Booking booking = bookingService.findByIdOrThrow(bookingId);
        User currentUser = securityUtils.getCurrentUser();

        boolean isClient = booking.getClient().getId().equals(currentUser.getId());
        boolean isMechanic = booking.getMechanic() != null
                && booking.getMechanic().getId().equals(currentUser.getId());

        if (!isClient && !isMechanic) {
            throw new AppExceptions.ForbiddenException(
                    "Access denied to maintenance records for booking " + bookingId);
        }

        return maintenanceRecordRepository.findByBookingId(bookingId);
    }
}
