package com.pfe.backend.vehicle;

import com.pfe.backend.vehicle.dto.VehicleDTO;
import com.pfe.backend.vehicle.dto.VehicleResponseDTO;
import com.pfe.backend.exception.ForbiddenOperationException;
import com.pfe.backend.exception.ResourceNotFoundException;
import com.pfe.backend.user.User;
import com.pfe.backend.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final UserService userService;
    private final VehicleMapper vehicleMapper;

    public VehicleResponseDTO createVehicleDto(VehicleDTO dto, Authentication authentication) {
        User owner = userService.findByEmail(authentication.getName());

        Vehicle vehicle = new Vehicle();
        vehicle.setMake(dto.getMake());
        vehicle.setModel(dto.getModel());
        vehicle.setYear(dto.getYear());
        vehicle.setVin(dto.getVin());
        vehicle.setLicensePlate(dto.getLicensePlate());
        vehicle.setEngineType(dto.getEngineType());
        vehicle.setMileage(dto.getMileage());
        vehicle.setOwner(owner);

        return vehicleMapper.toDto(vehicleRepository.save(vehicle));
    }

    public List<VehicleResponseDTO> getMyVehiclesDto(Authentication authentication) {
        User owner = userService.findByEmail(authentication.getName());
        return vehicleRepository.findByOwnerId(owner.getId())
                .stream()
                .map(vehicleMapper::toDto)
                .toList();
    }

    public VehicleResponseDTO getVehicleDto(Long id, Authentication authentication) {
        Vehicle vehicle = getVehicleById(id);
        assertOwnership(vehicle, authentication);
        return vehicleMapper.toDto(vehicle);
    }

    public VehicleResponseDTO updateVehicleDto(Long id, VehicleDTO dto, Authentication authentication) {
        Vehicle vehicle = getVehicleById(id);
        assertOwnership(vehicle, authentication);

        vehicle.setMake(dto.getMake());
        vehicle.setModel(dto.getModel());
        vehicle.setYear(dto.getYear());
        vehicle.setVin(dto.getVin());
        vehicle.setLicensePlate(dto.getLicensePlate());
        vehicle.setEngineType(dto.getEngineType());
        vehicle.setMileage(dto.getMileage());

        return vehicleMapper.toDto(vehicleRepository.save(vehicle));
    }

    public void deleteVehicle(Long id, Authentication authentication) {
        Vehicle vehicle = getVehicleById(id);
        assertOwnership(vehicle, authentication);
        vehicleRepository.delete(vehicle);
    }

    public Vehicle getVehicleById(Long id) {
        return vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", id));
    }

    private void assertOwnership(Vehicle vehicle, Authentication authentication) {
        if (!vehicle.getOwner().getEmail().equals(authentication.getName())) {
            throw new ForbiddenOperationException("VEHICLE", "ACCESS", "Not authorized");
        }
    }
}