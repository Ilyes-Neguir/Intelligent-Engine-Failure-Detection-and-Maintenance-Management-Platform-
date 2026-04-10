package com.engine.platform.service;

import com.engine.platform.exception.AppExceptions;
import com.engine.platform.model.*;
import com.engine.platform.repository.VehicleRepository;
import com.engine.platform.security.SecurityUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VehicleServiceSecurityTest {

    @Mock private VehicleRepository vehicleRepository;
    @Mock private SecurityUtils securityUtils;

    @InjectMocks
    private VehicleService vehicleService;

    private User owner;
    private User otherUser;
    private Vehicle vehicle;

    @BeforeEach
    void setUp() {
        owner = new User();
        owner.setId(1L);
        owner.setRole(Role.CLIENT);

        otherUser = new User();
        otherUser.setId(2L);
        otherUser.setRole(Role.CLIENT);

        vehicle = new Vehicle();
        vehicle.setId(100L);
        vehicle.setOwner(owner);
        vehicle.setMake("Toyota");
        vehicle.setModel("Corolla");
        vehicle.setYear(2020);
        vehicle.setLicensePlate("ABC-123");
    }

    @Test
    void updateVehicle_shouldRejectNonOwner() {
        when(securityUtils.getCurrentUserId()).thenReturn(otherUser.getId());
        when(vehicleRepository.findById(100L)).thenReturn(Optional.of(vehicle));

        com.engine.platform.dto.VehicleDTO dto = new com.engine.platform.dto.VehicleDTO();
        dto.setMake("Honda");
        dto.setModel("Civic");
        dto.setYear(2021);
        dto.setLicensePlate("XYZ-999");

        assertThatThrownBy(() -> vehicleService.updateVehicle(100L, dto))
                .isInstanceOf(AppExceptions.ForbiddenException.class)
                .hasMessageContaining("owner");
    }

    @Test
    void deleteVehicle_shouldRejectNonOwner() {
        when(securityUtils.getCurrentUserId()).thenReturn(otherUser.getId());
        when(vehicleRepository.findById(100L)).thenReturn(Optional.of(vehicle));

        assertThatThrownBy(() -> vehicleService.deleteVehicle(100L))
                .isInstanceOf(AppExceptions.ForbiddenException.class)
                .hasMessageContaining("owner");
    }

    @Test
    void updateVehicle_shouldAllowOwner() {
        when(securityUtils.getCurrentUserId()).thenReturn(owner.getId());
        when(vehicleRepository.findById(100L)).thenReturn(Optional.of(vehicle));
        when(vehicleRepository.save(any())).thenReturn(vehicle);

        com.engine.platform.dto.VehicleDTO dto = new com.engine.platform.dto.VehicleDTO();
        dto.setMake("Toyota");
        dto.setModel("Corolla");
        dto.setYear(2022);
        dto.setLicensePlate("ABC-456");

        vehicleService.updateVehicle(100L, dto);
        verify(vehicleRepository).save(vehicle);
    }
}
