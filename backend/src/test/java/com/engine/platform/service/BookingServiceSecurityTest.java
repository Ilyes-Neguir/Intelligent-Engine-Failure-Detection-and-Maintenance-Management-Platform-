package com.engine.platform.service;

import com.engine.platform.exception.AppExceptions;
import com.engine.platform.model.*;
import com.engine.platform.repository.BookingRepository;
import com.engine.platform.repository.VehicleRepository;
import com.engine.platform.security.SecurityUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceSecurityTest {

    @Mock private BookingRepository bookingRepository;
    @Mock private VehicleRepository vehicleRepository;
    @Mock private SecurityUtils securityUtils;

    @InjectMocks
    private BookingService bookingService;

    private User mechanic1;
    private User mechanic2;
    private User client;
    private Booking pendingBooking;
    private Booking confirmedBooking;

    @BeforeEach
    void setUp() {
        client = new User();
        client.setId(10L);
        client.setRole(Role.CLIENT);

        mechanic1 = new User();
        mechanic1.setId(1L);
        mechanic1.setRole(Role.MECHANIC);

        mechanic2 = new User();
        mechanic2.setId(2L);
        mechanic2.setRole(Role.MECHANIC);

        Vehicle vehicle = new Vehicle();
        vehicle.setId(100L);
        vehicle.setOwner(client);

        pendingBooking = new Booking();
        pendingBooking.setId(1L);
        pendingBooking.setClient(client);
        pendingBooking.setVehicle(vehicle);
        pendingBooking.setStatus(BookingStatus.PENDING);

        confirmedBooking = new Booking();
        confirmedBooking.setId(2L);
        confirmedBooking.setClient(client);
        confirmedBooking.setMechanic(mechanic1);
        confirmedBooking.setVehicle(vehicle);
        confirmedBooking.setStatus(BookingStatus.CONFIRMED);
    }

    @Test
    void acceptBooking_shouldAssignMechanicFromJwtNotFromPath() {
        // mechanic2 calls accept — the assigned mechanic must become mechanic2 (from JWT)
        when(securityUtils.getCurrentUser()).thenReturn(mechanic2);
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(pendingBooking));
        when(bookingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Booking result = bookingService.acceptBooking(1L);

        assertThat(result.getMechanic()).isEqualTo(mechanic2);
        assertThat(result.getStatus()).isEqualTo(BookingStatus.CONFIRMED);
    }

    @Test
    void startBooking_shouldRejectMechanicWhoIsNotAssigned() {
        // mechanic2 tries to start booking assigned to mechanic1 — must be rejected
        when(securityUtils.getCurrentUser()).thenReturn(mechanic2);
        when(bookingRepository.findById(2L)).thenReturn(Optional.of(confirmedBooking));

        assertThatThrownBy(() -> bookingService.startBooking(2L))
                .isInstanceOf(AppExceptions.ForbiddenException.class)
                .hasMessageContaining("not the assigned mechanic");
    }

    @Test
    void completeBooking_shouldRejectMechanicWhoIsNotAssigned() {
        Booking inProgressBooking = new Booking();
        inProgressBooking.setId(3L);
        inProgressBooking.setClient(client);
        inProgressBooking.setMechanic(mechanic1);
        Vehicle v = new Vehicle();
        v.setId(100L);
        v.setOwner(client);
        inProgressBooking.setVehicle(v);
        inProgressBooking.setStatus(BookingStatus.IN_PROGRESS);

        // mechanic2 tries to complete booking assigned to mechanic1
        when(securityUtils.getCurrentUser()).thenReturn(mechanic2);
        when(bookingRepository.findById(3L)).thenReturn(Optional.of(inProgressBooking));

        assertThatThrownBy(() -> bookingService.completeBooking(3L))
                .isInstanceOf(AppExceptions.ForbiddenException.class)
                .hasMessageContaining("not the assigned mechanic");
    }
}
