package com.pfe.backend.booking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByClientId(Long clientId);
    List<Booking> findByMechanicId(Long mechanicId);
    List<Booking> findByStatus(BookingStatus status);
    List<Booking> findByMechanicIdAndScheduledTimeBetween(Long mechanicId, LocalDateTime start, LocalDateTime end);
    List<Booking> findByStatusAndMechanicIsNull(BookingStatus status);
}