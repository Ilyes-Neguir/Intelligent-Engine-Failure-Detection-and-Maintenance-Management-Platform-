package com.engine.platform.service;

import com.engine.platform.exception.AppExceptions;
import com.engine.platform.model.*;
import com.engine.platform.repository.OBDDataRepository;
import com.engine.platform.security.SecurityUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DiagnosticServiceSecurityTest {

    @Mock private OBDDataRepository obdDataRepository;
    @Mock private BookingService bookingService;
    @Mock private com.engine.platform.client.FastApiClient fastApiClient;
    @Mock private SecurityUtils securityUtils;

    @InjectMocks
    private DiagnosticService diagnosticService;

    private User mechanic1;
    private User mechanic2;
    private Booking booking;

    @BeforeEach
    void setUp() {
        mechanic1 = new User();
        mechanic1.setId(1L);
        mechanic1.setRole(Role.MECHANIC);

        mechanic2 = new User();
        mechanic2.setId(2L);
        mechanic2.setRole(Role.MECHANIC);

        User client = new User();
        client.setId(10L);
        client.setRole(Role.CLIENT);

        Vehicle vehicle = new Vehicle();
        vehicle.setId(100L);
        vehicle.setOwner(client);

        booking = new Booking();
        booking.setId(1L);
        booking.setClient(client);
        booking.setMechanic(mechanic1);
        booking.setVehicle(vehicle);
        booking.setStatus(BookingStatus.IN_PROGRESS);
    }

    @Test
    void saveDiagnostic_shouldRejectUnassignedMechanic() {
        // mechanic2 is authenticated but mechanic1 is assigned to the booking
        when(securityUtils.getCurrentUser()).thenReturn(mechanic2);
        when(bookingService.findByIdOrThrow(1L)).thenReturn(booking);

        assertThatThrownBy(() -> diagnosticService.saveDiagnostic(1L, new com.engine.platform.dto.OBDDataDTO()))
                .isInstanceOf(AppExceptions.ForbiddenException.class)
                .hasMessageContaining("not the assigned mechanic");
    }

    @Test
    void getDiagnosticsByBooking_shouldRejectUnrelatedUser() {
        User stranger = new User();
        stranger.setId(99L);
        stranger.setRole(Role.CLIENT);

        when(securityUtils.getCurrentUser()).thenReturn(stranger);
        when(bookingService.findByIdOrThrow(1L)).thenReturn(booking);

        assertThatThrownBy(() -> diagnosticService.getDiagnosticsByBooking(1L))
                .isInstanceOf(AppExceptions.ForbiddenException.class)
                .hasMessageContaining("Access denied");
    }
}
