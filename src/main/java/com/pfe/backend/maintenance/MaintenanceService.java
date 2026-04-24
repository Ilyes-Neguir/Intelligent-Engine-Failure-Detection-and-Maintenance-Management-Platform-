package com.pfe.backend.maintenance;

import com.pfe.backend.booking.Booking;
import com.pfe.backend.booking.BookingService;
import com.pfe.backend.maintenance.dto.MaintenanceRecordDTO;
import com.pfe.backend.exception.ForbiddenOperationException;
import com.pfe.backend.exception.MechanicAssignmentException;
import com.pfe.backend.exception.UserByEmailNotFoundException;
import com.pfe.backend.user.Role;
import com.pfe.backend.user.User;
import com.pfe.backend.user.UserRepository;
import com.pfe.backend.vehicle.Vehicle;
import com.pfe.backend.vehicle.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MaintenanceService {

    private final MaintenanceRecordRepository maintenanceRecordRepository;
    private final BookingService bookingService;
    private final VehicleService vehicleService;
    private final UserRepository userRepository;

    public MaintenanceRecord createRecordDto(Long bookingId, MaintenanceRecordDTO dto, Authentication authentication) {
        User mechanic = getCurrentUser(authentication);

        if (mechanic.getRole() != Role.MECHANIC) {
            throw new ForbiddenOperationException("MAINTENANCE", "CREATE", "Only mechanics can create maintenance records.");
        }

        MaintenanceRecord record = new MaintenanceRecord();
        record.setIntervention(dto.getIntervention());
        record.setNotes(dto.getNotes());
        record.setPartsReplaced(dto.getPartsReplaced());
        record.setCost(dto.getCost());

        return createRecord(bookingId, record, mechanic.getId());
    }

    public MaintenanceRecord createRecord(Long bookingId, MaintenanceRecord record, Long mechanicId) {
        Booking booking = bookingService.getBookingById(bookingId);

        if (booking.getMechanic() == null || !booking.getMechanic().getId().equals(mechanicId)) {
            throw new MechanicAssignmentException("Only the assigned mechanic can create maintenance records.");
        }

        record.setBooking(booking);
        return maintenanceRecordRepository.save(record);
    }

    public List<MaintenanceRecord> getRecordsByBookingForCurrentUser(Long bookingId, Authentication authentication) {
        Booking booking = bookingService.getBookingForCurrentUser(bookingId, authentication);
        return maintenanceRecordRepository.findByBookingId(booking.getId());
    }

    public List<MaintenanceRecord> getRecordsByVehicleForCurrentUser(Long vehicleId, Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        Vehicle vehicle = vehicleService.getVehicleById(vehicleId);

        boolean owner = vehicle.getOwner().getId().equals(currentUser.getId());
        boolean mechanic = currentUser.getRole() == Role.MECHANIC;

        if (!owner && !mechanic) {
            throw new ForbiddenOperationException("MAINTENANCE", "READ", "Not authorized to access this vehicle maintenance history.");
        }

        return maintenanceRecordRepository.findByBookingVehicleId(vehicleId);
    }

    private User getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserByEmailNotFoundException(email));
    }
}