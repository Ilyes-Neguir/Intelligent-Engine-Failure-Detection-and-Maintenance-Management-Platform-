package com.engine.platform.service;

import com.engine.platform.dto.BookingRequest;
import com.engine.platform.entity.*;
import com.engine.platform.exception.AppExceptions;
import com.engine.platform.repository.BookingRepository;
import com.engine.platform.repository.VehicleRepository;
import com.engine.platform.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final VehicleRepository vehicleRepository;

    /**
     * Create a booking. Client identity is derived from JWT — no userId in URL.
     */
    public Booking create(BookingRequest request, User client) {
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                        "Vehicle not found with id: " + request.getVehicleId()));
        // Client must own the vehicle they are booking for
        if (!vehicle.getOwner().getId().equals(client.getId())) {
            throw new AppExceptions.ForbiddenException("You can only book your own vehicles");
        }
        Booking booking = new Booking();
        booking.setClient(client);
        booking.setVehicle(vehicle);
        booking.setDescription(request.getDescription());
        booking.setScheduledAt(request.getScheduledAt());
        booking.setStatus(BookingStatus.PENDING);
        return bookingRepository.save(booking);
    }

    /**
     * Mechanic accepts a PENDING booking. Mechanic identity from JWT.
     */
    public Booking accept(Long bookingId, User mechanic) {
        Booking booking = getBookingById(bookingId);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new AppExceptions.ConflictException(
                    "Booking is not PENDING; current status: " + booking.getStatus());
        }
        booking.setMechanic(mechanic);
        booking.setStatus(BookingStatus.CONFIRMED);
        return bookingRepository.save(booking);
    }

    /**
     * Mechanic starts a CONFIRMED booking. Must be the assigned mechanic.
     */
    public Booking start(Long bookingId, User mechanic) {
        Booking booking = getBookingById(bookingId);
        assertAssignedMechanic(booking, mechanic.getId());
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new AppExceptions.ConflictException(
                    "Booking is not CONFIRMED; current status: " + booking.getStatus());
        }
        booking.setStatus(BookingStatus.IN_PROGRESS);
        return bookingRepository.save(booking);
    }

    /**
     * Mechanic completes an IN_PROGRESS booking. Must be the assigned mechanic.
     */
    public Booking complete(Long bookingId, User mechanic) {
        Booking booking = getBookingById(bookingId);
        assertAssignedMechanic(booking, mechanic.getId());
        if (booking.getStatus() != BookingStatus.IN_PROGRESS) {
            throw new AppExceptions.ConflictException(
                    "Booking is not IN_PROGRESS; current status: " + booking.getStatus());
        }
        booking.setStatus(BookingStatus.COMPLETED);
        return bookingRepository.save(booking);
    }

    /**
     * Client cancels their own booking. Client identity from JWT.
     */
    public Booking cancel(Long bookingId, User client) {
        Booking booking = getBookingById(bookingId);
        if (!booking.getClient().getId().equals(client.getId())) {
            throw new AppExceptions.ForbiddenException("You can only cancel your own bookings");
        }
        if (booking.getStatus() == BookingStatus.COMPLETED
                || booking.getStatus() == BookingStatus.CANCELED) {
            throw new AppExceptions.ConflictException(
                    "Cannot cancel a booking with status: " + booking.getStatus());
        }
        booking.setStatus(BookingStatus.CANCELED);
        return bookingRepository.save(booking);
    }

    /**
     * Get bookings for the current user: CLIENT sees own, MECHANIC sees assigned.
     */
    public List<Booking> getMyBookings(User user) {
        if (user.getRole() == Role.MECHANIC) {
            return bookingRepository.findByMechanicId(user.getId());
        }
        return bookingRepository.findByClientId(user.getId());
    }

    /**
     * Get a specific booking; allowed if the current user is the client or assigned mechanic.
     */
    public Booking getBookingForCurrentUser(Long bookingId, User user) {
        Booking booking = getBookingById(bookingId);
        boolean isClient = booking.getClient().getId().equals(user.getId());
        boolean isMechanic = booking.getMechanic() != null
                && booking.getMechanic().getId().equals(user.getId());
        if (!isClient && !isMechanic) {
            throw new AppExceptions.ForbiddenException("Access denied to this booking");
        }
        return booking;
    }

    // ---- internal helpers ----

    public Booking getBookingById(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                        "Booking not found with id: " + bookingId));
    }

    private void assertAssignedMechanic(Booking booking, Long mechanicId) {
        if (booking.getMechanic() == null
                || !booking.getMechanic().getId().equals(mechanicId)) {
            throw new AppExceptions.ForbiddenException(
                    "You are not the assigned mechanic for this booking");
        }
    }
}
