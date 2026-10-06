package com.kodebutikken.kinoxp.controller;

import com.kodebutikken.kinoxp.dto.ReservationRequest;
import com.kodebutikken.kinoxp.dto.ReservationResponse;
import com.kodebutikken.kinoxp.model.Reservation;
import com.kodebutikken.kinoxp.service.ReservationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PostMapping
    public ResponseEntity<ReservationResponse> createReservation( @Valid @RequestBody ReservationRequest request) {
        ReservationResponse reservation = reservationService.createReservation(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reservation);
    }

    @GetMapping ("/{orderNumber}")
    public ResponseEntity<ReservationResponse> getReservation(@PathVariable Long orderNumber) {
        return ResponseEntity.ok(reservationService.getReservation((orderNumber)));
    }

    @PutMapping("/{orderNumber}/paid")
    public ResponseEntity<ReservationResponse> markAsPaid(@PathVariable Long orderNumber) {
        return ResponseEntity.ok(reservationService.markAsPaid(orderNumber));
    }

    @GetMapping(params = {"orderNumber", "email", "name"})
    public ResponseEntity<ReservationResponse> getReservationFromCustomer(@RequestParam Long orderNumber,
                                                                         @RequestParam String email,
                                                                         @RequestParam String name) {
        return ResponseEntity.ok(reservationService.getReservationForCustomer(orderNumber, email, name));
    }

    @DeleteMapping("/{orderNumber}/seats/{seatId}")
    public ResponseEntity<Void> cancelTicket(@PathVariable Long orderNumber,
                                             @PathVariable Long seatId,
                                             @RequestParam String email) {
        reservationService.cancelTicket(orderNumber, seatId, email);
        return ResponseEntity.noContent().build();
    }
}