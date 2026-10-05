package com.kodebutikken.kinoxp.repository;

import com.kodebutikken.kinoxp.model.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    void deleteByShowingId(Long showingId);
}
