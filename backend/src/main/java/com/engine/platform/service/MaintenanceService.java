package com.engine.platform.service;

import com.engine.platform.entity.Booking;
import com.engine.platform.entity.MaintenanceRecord;
import com.engine.platform.entity.User;
import com.engine.platform.exception.AppExceptions;
import com.engine.platform.repository.MaintenanceRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MaintenanceService {

    private final MaintenanceRecordRepository maintenanceRecordRepository;
    private final BookingService bookingService;

    /**
     * Add a maintenance record for a booking.
     * Only the assigned mechanic (identity from JWT) may add records.
     */
    public MaintenanceRecord addRecord(Long bookingId, String description, User mechanic) {
        Booking booking = bookingService.getBookingById(bookingId);
        if (booking.getMechanic() == null
                || !booking.getMechanic().getId().equals(mechanic.getId())) {
            throw new AppExceptions.ForbiddenException(
                    "Only the assigned mechanic can add maintenance records");
        }
        MaintenanceRecord record = new MaintenanceRecord();
        record.setBooking(booking);
        record.setMechanic(mechanic);
        record.setDescription(description);
        return maintenanceRecordRepository.save(record);
    }

    /**
     * Get all maintenance records for a booking.
     * Accessible by both the booking client and assigned mechanic.
     */
    public List<MaintenanceRecord> getRecordsByBooking(Long bookingId, User user) {
        Booking booking = bookingService.getBookingById(bookingId);
        boolean isClient = booking.getClient().getId().equals(user.getId());
        boolean isMechanic = booking.getMechanic() != null
                && booking.getMechanic().getId().equals(user.getId());
        if (!isClient && !isMechanic) {
            throw new AppExceptions.ForbiddenException(
                    "Access denied: not the booking client or assigned mechanic");
        }
        return maintenanceRecordRepository.findByBookingId(bookingId);
    }
}
