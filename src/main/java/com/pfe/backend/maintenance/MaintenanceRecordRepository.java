package com.pfe.backend.maintenance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenanceRecordRepository extends JpaRepository<MaintenanceRecord, Long> {
    List<MaintenanceRecord> findByBookingId(Long bookingId);
    List<MaintenanceRecord> findByBookingVehicleId(Long vehicleId);
}