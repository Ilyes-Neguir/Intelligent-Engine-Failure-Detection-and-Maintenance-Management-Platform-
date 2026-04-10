package com.engine.platform.repository;

import com.engine.platform.entity.MaintenanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MaintenanceRecordRepository extends JpaRepository<MaintenanceRecord, Long> {
    List<MaintenanceRecord> findByBookingId(Long bookingId);
    List<MaintenanceRecord> findByMechanicId(Long mechanicId);
}
