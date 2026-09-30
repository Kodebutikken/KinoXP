package com.kodebutikken.kinoxp.service;

import com.kodebutikken.kinoxp.model.Reservation;
import com.kodebutikken.kinoxp.repository.ReservationRepository;
import com.kodebutikken.kinoxp.repository.ShowingRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

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
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Showing not found");
        }
        return reservationRepository.save(reservation);
    }
}