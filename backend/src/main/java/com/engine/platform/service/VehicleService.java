package com.engine.platform.service;

import com.engine.platform.dto.VehicleDTO;
import com.engine.platform.exception.AppExceptions;
import com.engine.platform.model.User;
import com.engine.platform.model.Vehicle;
import com.engine.platform.repository.VehicleRepository;
import com.engine.platform.security.SecurityUtils;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final SecurityUtils securityUtils;

    public VehicleService(VehicleRepository vehicleRepository, SecurityUtils securityUtils) {
        this.vehicleRepository = vehicleRepository;
        this.securityUtils = securityUtils;
    }

    /**
     * Create a vehicle. Owner is always set from JWT (never from path/body).
     */
    public Vehicle createVehicle(VehicleDTO dto) {
        User currentUser = securityUtils.getCurrentUser();
        Vehicle vehicle = new Vehicle();
        vehicle.setMake(dto.getMake());
        vehicle.setModel(dto.getModel());
        vehicle.setYear(dto.getYear());
        vehicle.setLicensePlate(dto.getLicensePlate());
        vehicle.setOwner(currentUser);
        return vehicleRepository.save(vehicle);
    }

    /**
     * Update a vehicle. Only the owner (derived from JWT) can update.
     */
    public Vehicle updateVehicle(Long vehicleId, VehicleDTO dto) {
        Vehicle vehicle = findByIdOrThrow(vehicleId);
        Long currentUserId = securityUtils.getCurrentUserId();

        if (!vehicle.getOwner().getId().equals(currentUserId)) {
            throw new AppExceptions.ForbiddenException("Only the vehicle owner can update this vehicle");
        }

        vehicle.setMake(dto.getMake());
        vehicle.setModel(dto.getModel());
        vehicle.setYear(dto.getYear());
        vehicle.setLicensePlate(dto.getLicensePlate());
        return vehicleRepository.save(vehicle);
    }

    /**
     * Delete a vehicle. Only the owner (derived from JWT) can delete.
     */
    public void deleteVehicle(Long vehicleId) {
        Vehicle vehicle = findByIdOrThrow(vehicleId);
        Long currentUserId = securityUtils.getCurrentUserId();

        if (!vehicle.getOwner().getId().equals(currentUserId)) {
            throw new AppExceptions.ForbiddenException("Only the vehicle owner can delete this vehicle");
        }

        vehicleRepository.delete(vehicle);
    }

    /**
     * List vehicles for the authenticated user.
     */
    public List<Vehicle> getMyVehicles() {
        Long currentUserId = securityUtils.getCurrentUserId();
        return vehicleRepository.findByOwnerId(currentUserId);
    }

    public Vehicle getVehicleById(Long vehicleId) {
        return findByIdOrThrow(vehicleId);
    }

    private Vehicle findByIdOrThrow(Long vehicleId) {
        return vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException("Vehicle not found with id: " + vehicleId));
    }
}
