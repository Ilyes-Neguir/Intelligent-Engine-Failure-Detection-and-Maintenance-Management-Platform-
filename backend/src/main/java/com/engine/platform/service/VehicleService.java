package com.engine.platform.service;

import com.engine.platform.dto.VehicleRequest;
import com.engine.platform.entity.User;
import com.engine.platform.entity.Vehicle;
import com.engine.platform.exception.AppExceptions;
import com.engine.platform.repository.VehicleRepository;
import com.engine.platform.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;

    /**
     * Create a vehicle for the currently authenticated CLIENT.
     * Owner is derived from JWT — not from any request parameter.
     */
    public Vehicle create(VehicleRequest request, User owner) {
        Vehicle vehicle = new Vehicle();
        vehicle.setMake(request.getMake());
        vehicle.setModel(request.getModel());
        vehicle.setYear(request.getYear());
        vehicle.setLicensePlate(request.getLicensePlate());
        vehicle.setOwner(owner);
        return vehicleRepository.save(vehicle);
    }

    /**
     * List all vehicles owned by the currently authenticated user.
     */
    public List<Vehicle> getMyVehicles() {
        Long ownerId = SecurityUtils.getCurrentUserId();
        return vehicleRepository.findByOwnerId(ownerId);
    }

    /**
     * Get a single vehicle. Only the owner may access it.
     */
    public Vehicle getById(Long id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException("Vehicle not found with id: " + id));
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (!vehicle.getOwner().getId().equals(currentUserId)) {
            throw new AppExceptions.ForbiddenException("Access denied: you do not own this vehicle");
        }
        return vehicle;
    }

    /**
     * Update a vehicle. Only the owner may update.
     */
    public Vehicle update(Long id, VehicleRequest request) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException("Vehicle not found with id: " + id));
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (!vehicle.getOwner().getId().equals(currentUserId)) {
            throw new AppExceptions.ForbiddenException("Access denied: you do not own this vehicle");
        }
        vehicle.setMake(request.getMake());
        vehicle.setModel(request.getModel());
        vehicle.setYear(request.getYear());
        vehicle.setLicensePlate(request.getLicensePlate());
        return vehicleRepository.save(vehicle);
    }

    /**
     * Delete a vehicle. Only the owner may delete.
     */
    public void delete(Long id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException("Vehicle not found with id: " + id));
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (!vehicle.getOwner().getId().equals(currentUserId)) {
            throw new AppExceptions.ForbiddenException("Access denied: you do not own this vehicle");
        }
        vehicleRepository.delete(vehicle);
    }
}
