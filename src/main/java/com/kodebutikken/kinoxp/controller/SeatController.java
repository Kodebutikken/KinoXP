package com.kodebutikken.kinoxp.controller;

import com.kodebutikken.kinoxp.dto.SeatAvailabilityResponse;
import com.kodebutikken.kinoxp.service.ReservationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/showings")

public class SeatController {

    private final ReservationService reservationService;

    public SeatController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @GetMapping("/{showingId}/seats")
    public ResponseEntity<List<SeatAvailabilityResponse>> getSeatsForShowing(@PathVariable Long showingId) {
        return ResponseEntity.ok(reservationService.getSeatsForShowing(showingId));
    }
}
