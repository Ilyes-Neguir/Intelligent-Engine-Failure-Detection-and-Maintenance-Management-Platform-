package com.pfe.backend.booking;

import com.pfe.backend.booking.dto.BookingDTO;
import com.pfe.backend.booking.dto.BookingResponseDTO;
import com.pfe.backend.exception.*;
import com.pfe.backend.user.Role;
import com.pfe.backend.user.User;
import com.pfe.backend.user.UserRepository;
import com.pfe.backend.vehicle.Vehicle;
import com.pfe.backend.vehicle.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final VehicleService vehicleService;
    private final BookingMapper bookingMapper;

    public BookingResponseDTO createBookingDto(BookingDTO dto, Authentication authentication) {
        return bookingMapper.toDto(createBooking(dto.getVehicleId(), dto.getScheduledTime(), dto.getDescription(), authentication));
    }

    public List<BookingResponseDTO> getMyBookingsDto(Authentication authentication) {
        return getMyBookings(authentication).stream().map(bookingMapper::toDto).toList();
    }

    public BookingResponseDTO acceptBookingDto(Long id, Authentication authentication) {
        return bookingMapper.toDto(acceptBooking(id, authentication));
    }

    public BookingResponseDTO cancelBookingDto(Long id, Authentication authentication) {
        return bookingMapper.toDto(cancelBooking(id, authentication));
    }

    public BookingResponseDTO startBookingDto(Long id, Authentication authentication) {
        return bookingMapper.toDto(startBooking(id, authentication));
    }

    public BookingResponseDTO completeBookingDto(Long id, String notes, Authentication authentication) {
        return bookingMapper.toDto(completeBooking(id, notes, authentication));
    }

    public BookingResponseDTO getBookingForCurrentUserDto(Long id, Authentication authentication) {
        return bookingMapper.toDto(getBookingForCurrentUser(id, authentication));
    }

    public Booking createBooking(Long vehicleId, LocalDateTime scheduledTime, String description, Authentication authentication) {
        String email = authentication.getName();
        User client = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserByEmailNotFoundException(email));

        Vehicle vehicle = vehicleService.getVehicleById(vehicleId);
        if (!vehicle.getOwner().getId().equals(client.getId())) {
            throw new ForbiddenOperationException("BOOKING", "CREATE",
                    "You can only create bookings for your own vehicle.");
        }

        Booking booking = new Booking();
        booking.setClient(client);
        booking.setVehicle(vehicle);
        booking.setScheduledTime(scheduledTime);
        booking.setDescription(description);
        booking.setStatus(BookingStatus.PENDING);
        return bookingRepository.save(booking);
    }

    public List<Booking> getMyBookings(Authentication authentication) {
        String email = authentication.getName();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserByEmailNotFoundException(email));

        if (currentUser.getRole() == Role.MECHANIC) {
            List<Booking> assigned = bookingRepository.findByMechanicId(currentUser.getId());
            List<Booking> pending = bookingRepository.findByStatusAndMechanicIsNull(BookingStatus.PENDING);

            return Stream.concat(assigned.stream(), pending.stream())
                    .distinct()
                    .toList();
        }
        return bookingRepository.findByClientId(currentUser.getId());
    }

    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new BookingNotFoundException(id));
    }

    public Booking getBookingForCurrentUser(Long id, Authentication authentication) {
        Booking booking = getBookingById(id);
        String email = authentication.getName();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserByEmailNotFoundException(email));

        boolean isClient = booking.getClient().getId().equals(currentUser.getId());
        boolean isMechanic = booking.getMechanic() != null && booking.getMechanic().getId().equals(currentUser.getId());

        if (!isClient && !isMechanic) {
            throw new ForbiddenOperationException("BOOKING", "READ",
                    "You are not allowed to access this booking.");
        }

        return booking;
    }

    public Booking acceptBooking(Long id, Authentication authentication) {
        Booking booking = getBookingById(id);

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new InvalidBookingTransitionException(
                    "Only PENDING bookings can be accepted. Current status: " + booking.getStatus());
        }

        String email = authentication.getName();
        User mechanic = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserByEmailNotFoundException(email));

        booking.setMechanic(mechanic);
        booking.setStatus(BookingStatus.CONFIRMED);
        return bookingRepository.save(booking);
    }

    public Booking startBooking(Long id, Authentication authentication) {
        Booking booking = getBookingById(id);
        String email = authentication.getName();

        User currentMechanic = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserByEmailNotFoundException(email));

        if (booking.getMechanic() == null) {
            booking.setMechanic(currentMechanic);
        } else if (!booking.getMechanic().getId().equals(currentMechanic.getId())) {
            throw new MechanicAssignmentException(
                    "Only the assigned mechanic can start this booking.");
        }

        if (booking.getStatus() != BookingStatus.CONFIRMED && booking.getStatus() != BookingStatus.PENDING) {
            throw new InvalidBookingTransitionException(
                    "Current status cannot be started: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.IN_PROGRESS);
        return bookingRepository.save(booking);
    }

    public Booking completeBooking(Long id, String notes, Authentication authentication) {
        Booking booking = getBookingById(id);
        String email = authentication.getName();

        User currentMechanic = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserByEmailNotFoundException(email));

        if (booking.getMechanic() == null || !booking.getMechanic().getId().equals(currentMechanic.getId())) {
            throw new MechanicAssignmentException(
                    "Only the assigned mechanic can complete this booking.");
        }

        if (booking.getStatus() != BookingStatus.IN_PROGRESS) {
            throw new InvalidBookingTransitionException(
                    "Only IN_PROGRESS bookings can be completed. Current status: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.COMPLETED);
        booking.setMechanicNotes(notes);
        return bookingRepository.save(booking);
    }

    public Booking cancelBooking(Long id, Authentication authentication) {
        Booking booking = getBookingById(id);
        String email = authentication.getName();

        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserByEmailNotFoundException(email));

        if (!booking.getClient().getId().equals(currentUser.getId())) {
            throw new ForbiddenOperationException("BOOKING", "CANCEL",
                    "Only booking owner can cancel.");
        }

        if (booking.getStatus() == BookingStatus.COMPLETED || booking.getStatus() == BookingStatus.CANCELED) {
            throw new InvalidBookingTransitionException(
                    "Cannot cancel booking in status: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.CANCELED);
        return bookingRepository.save(booking);
    }
}