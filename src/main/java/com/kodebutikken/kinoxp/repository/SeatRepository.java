package com.kodebutikken.kinoxp.repository;

import com.kodebutikken.kinoxp.model.Seat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SeatRepository extends JpaRepository<Seat, Long> {
    List<Seat> findByTheaterIdOrderBySeatRowAscSeatNumberAsc(Long theaterId);
}
