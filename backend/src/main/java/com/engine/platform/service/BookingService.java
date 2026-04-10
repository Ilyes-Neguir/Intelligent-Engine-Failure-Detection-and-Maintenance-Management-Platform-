package com.engine.platform.service;

import com.engine.platform.dto.BookingRequest;
import com.engine.platform.exception.AppExceptions;
import com.engine.platform.model.*;
import com.engine.platform.repository.BookingRepository;
import com.engine.platform.repository.VehicleRepository;
import com.engine.platform.security.SecurityUtils;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final VehicleRepository vehicleRepository;
    private final SecurityUtils securityUtils;

    public BookingService(BookingRepository bookingRepository,
                          VehicleRepository vehicleRepository,
                          SecurityUtils securityUtils) {
        this.bookingRepository = bookingRepository;
        this.vehicleRepository = vehicleRepository;
        this.securityUtils = securityUtils;
    }

    /**
     * Create a booking. clientId is always derived from JWT.
     */
    public Booking createBooking(BookingRequest request) {
        User currentUser = securityUtils.getCurrentUser();

        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                        "Vehicle not found with id: " + request.getVehicleId()));

        // Only the vehicle owner can book with their own vehicle
        if (!vehicle.getOwner().getId().equals(currentUser.getId())) {
            throw new AppExceptions.ForbiddenException("You can only book with your own vehicle");
        }

        Booking booking = new Booking();
        booking.setClient(currentUser);
        booking.setVehicle(vehicle);
        booking.setStatus(BookingStatus.PENDING);
        booking.setNotes(request.getNotes());
        return bookingRepository.save(booking);
    }

    /**
     * Accept a booking. mechanicId is always derived from JWT (ignores any path param).
     * Any available MECHANIC can accept a PENDING booking.
     */
    public Booking acceptBooking(Long bookingId) {
        User currentMechanic = securityUtils.getCurrentUser();
        Booking booking = findByIdOrThrow(bookingId);

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new AppExceptions.BadRequestException(
                    "Booking cannot be accepted; current status is: " + booking.getStatus());
        }

        booking.setMechanic(currentMechanic);
        booking.setStatus(BookingStatus.CONFIRMED);
        return bookingRepository.save(booking);
    }

    /**
     * Start a booking. mechanicId is derived from JWT; verifies the calling mechanic is assigned.
     */
    public Booking startBooking(Long bookingId) {
        User currentMechanic = securityUtils.getCurrentUser();
        Booking booking = findByIdOrThrow(bookingId);

        assertAssignedMechanic(booking, currentMechanic.getId());

        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new AppExceptions.BadRequestException(
                    "Booking cannot be started; current status is: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.IN_PROGRESS);
        return bookingRepository.save(booking);
    }

    /**
     * Complete a booking. mechanicId is derived from JWT; verifies the calling mechanic is assigned.
     */
    public Booking completeBooking(Long bookingId) {
        User currentMechanic = securityUtils.getCurrentUser();
        Booking booking = findByIdOrThrow(bookingId);

        assertAssignedMechanic(booking, currentMechanic.getId());

        if (booking.getStatus() != BookingStatus.IN_PROGRESS) {
            throw new AppExceptions.BadRequestException(
                    "Booking cannot be completed; current status is: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.COMPLETED);
        return bookingRepository.save(booking);
    }

    /**
     * Cancel a booking. Only the booking client (from JWT) or an assigned mechanic can cancel.
     */
    public Booking cancelBooking(Long bookingId) {
        User currentUser = securityUtils.getCurrentUser();
        Booking booking = findByIdOrThrow(bookingId);

        boolean isClient = booking.getClient().getId().equals(currentUser.getId());
        boolean isMechanic = booking.getMechanic() != null
                && booking.getMechanic().getId().equals(currentUser.getId());

        if (!isClient && !isMechanic) {
            throw new AppExceptions.ForbiddenException("You are not authorized to cancel this booking");
        }

        if (booking.getStatus() == BookingStatus.COMPLETED) {
            throw new AppExceptions.BadRequestException("Cannot cancel a completed booking");
        }

        booking.setStatus(BookingStatus.CANCELED);
        return bookingRepository.save(booking);
    }

    /**
     * Get bookings for the currently authenticated user (CLIENT sees their bookings,
     * MECHANIC sees assigned bookings).
     */
    public List<Booking> getMyBookings() {
        User currentUser = securityUtils.getCurrentUser();
        if (currentUser.getRole() == Role.MECHANIC) {
            return bookingRepository.findByMechanicId(currentUser.getId());
        }
        return bookingRepository.findByClientId(currentUser.getId());
    }

    public Booking getBookingById(Long bookingId) {
        Booking booking = findByIdOrThrow(bookingId);
        User currentUser = securityUtils.getCurrentUser();

        // Allow: booking client, assigned mechanic, or ADMIN
        boolean isClient = booking.getClient().getId().equals(currentUser.getId());
        boolean isMechanic = booking.getMechanic() != null
                && booking.getMechanic().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;

        if (!isClient && !isMechanic && !isAdmin) {
            throw new AppExceptions.ForbiddenException("Access denied to this booking");
        }
        return booking;
    }

    // Visible for DiagnosticService and ReportService
    public Booking findByIdOrThrow(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                        "Booking not found with id: " + bookingId));
    }

    private void assertAssignedMechanic(Booking booking, Long mechanicId) {
        if (booking.getMechanic() == null || !booking.getMechanic().getId().equals(mechanicId)) {
            throw new AppExceptions.ForbiddenException(
                    "You are not the assigned mechanic for this booking");
        }
    }
}
