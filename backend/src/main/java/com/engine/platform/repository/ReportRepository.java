package com.engine.platform.repository;

import com.engine.platform.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ReportRepository extends JpaRepository<Report, Long> {
    Optional<Report> findByBookingId(Long bookingId);
    boolean existsByBookingId(Long bookingId);
}
