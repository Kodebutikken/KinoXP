package com.kodebutikken.kinoxp.repository;

import com.kodebutikken.kinoxp.model.ReservationSeat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ReservationSeatRepository extends JpaRepository<ReservationSeat, ReservationSeat.ReservationSeatId> {

    // Er et eller flere af sæderne allerede booket til forestillingen?
    boolean existsByShowingIdAndSeatIdIn(Long showingId, Collection<Long> seatIds);

    // Alle optagne sæder til en forestilling – bruges til at markere dem som optaget
    List<ReservationSeat> findByShowingId(Long showingId);

    // Sæderne i én reservation – bruges når en reservation vises
    List<ReservationSeat> findByReservationId(Long reservationId);
}
