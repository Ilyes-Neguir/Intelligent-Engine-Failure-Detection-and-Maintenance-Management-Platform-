package com.engine.platform.repository;

import com.engine.platform.entity.Booking;
import com.engine.platform.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByClientId(Long clientId);
    List<Booking> findByMechanicId(Long mechanicId);
    List<Booking> findByStatus(BookingStatus status);
}
