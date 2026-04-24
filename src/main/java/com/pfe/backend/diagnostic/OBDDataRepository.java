package com.pfe.backend.diagnostic;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OBDDataRepository extends JpaRepository<OBDData, Long> {
    Optional<OBDData> findByBookingId(Long bookingId);
}