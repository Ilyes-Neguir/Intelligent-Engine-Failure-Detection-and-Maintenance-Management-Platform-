package com.engine.platform.repository;

import com.engine.platform.model.OBDData;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OBDDataRepository extends JpaRepository<OBDData, Long> {
    List<OBDData> findByBookingId(Long bookingId);
}
