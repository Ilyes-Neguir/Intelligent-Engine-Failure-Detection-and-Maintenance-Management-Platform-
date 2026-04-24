package com.engine.platform.repository;

import com.engine.platform.model.Booking;
import com.engine.platform.model.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByClientId(Long clientId);
    List<Booking> findByMechanicId(Long mechanicId);
    List<Booking> findByStatus(BookingStatus status);
    List<Booking> findByClientIdOrMechanicId(Long clientId, Long mechanicId);
}
