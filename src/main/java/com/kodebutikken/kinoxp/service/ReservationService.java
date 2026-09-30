package com.kodebutikken.kinoxp.service;

import com.kodebutikken.kinoxp.exception.ShowingNotFoundException;
import com.kodebutikken.kinoxp.model.Reservation;
import com.kodebutikken.kinoxp.repository.ReservationRepository;
import com.kodebutikken.kinoxp.repository.ShowingRepository;
import org.springframework.stereotype.Service;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final ShowingRepository showingRepository;

    public ReservationService(ReservationRepository reservationRepository,
                              ShowingRepository showingRepository) {
        this.reservationRepository = reservationRepository;
        this.showingRepository = showingRepository;
    }

    public Reservation createReservation(Reservation reservation) {
        if (!showingRepository.existsById(reservation.getShowingId())) {
            throw new ShowingNotFoundException("Showing not found: " + reservation.getShowingId());
        }
        return reservationRepository.save(reservation);
    }
}