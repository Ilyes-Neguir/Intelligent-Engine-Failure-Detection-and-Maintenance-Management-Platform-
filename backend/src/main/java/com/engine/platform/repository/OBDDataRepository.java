package com.engine.platform.repository;

import com.engine.platform.entity.OBDData;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface OBDDataRepository extends JpaRepository<OBDData, Long> {
    Optional<OBDData> findByBookingId(Long bookingId);
    boolean existsByBookingId(Long bookingId);
}
