package com.kodebutikken.kinoxp.repository;

import com.kodebutikken.kinoxp.model.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;

import java.util.List;
import java.util.Optional;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    void deleteByShowingId(Long showingId);
    Optional<Reservation> findByOrderNumber(Long orderNumber);
    boolean existsByOrderNumber(Long orderNumber);
    List<Reservation> findByShowingStartTimeAfterOrderByShowingStartTimeAsc(LocalDateTime time);
}
