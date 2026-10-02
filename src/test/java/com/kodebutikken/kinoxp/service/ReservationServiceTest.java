package com.kodebutikken.kinoxp.service;

import com.kodebutikken.kinoxp.exception.ShowingNotFoundException;
import com.kodebutikken.kinoxp.model.Reservation;
import com.kodebutikken.kinoxp.model.Showing;
import com.kodebutikken.kinoxp.repository.ReservationRepository;
import com.kodebutikken.kinoxp.repository.ShowingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ReservationServiceTest {

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private ShowingRepository showingRepository;

    @InjectMocks
    private ReservationService reservationService;

    @Test
    void createReservation_Success() {
        Long showingId = 1L;

        Showing showing = new Showing();
        showing.setId(showingId);

        Reservation reservation = new Reservation();
        reservation.setShowing(showing);

        when(showingRepository.existsById(showingId)).thenReturn(true);
        when(reservationRepository.save(reservation)).thenReturn(reservation);

        Reservation createdReservation = reservationService.createReservation(reservation);

        assertEquals(reservation, createdReservation);
        verify(reservationRepository).save(reservation);
    }

    @Test
    void createReservation_shouldThrow_whenShowingDoesNotExist() {
        Long showingId = 99L;
        Showing showing = new Showing();
        showing.setId(showingId);

        Reservation reservation = new Reservation();
        reservation.setShowing(showing);

        when(showingRepository.existsById(showingId)).thenReturn(false);

        ShowingNotFoundException exception = assertThrows(
                ShowingNotFoundException.class,
                () -> reservationService.createReservation(reservation)
        );

        assertEquals("Showing not found: " + showingId, exception.getMessage());
        verify(reservationRepository, never()).save(reservation);
    }

}
