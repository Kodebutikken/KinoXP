package com.kodebutikken.kinoxp.dto;

import com.kodebutikken.kinoxp.model.Reservation;
import com.kodebutikken.kinoxp.model.Seat;

import java.time.LocalDateTime;
import java.util.List;

public record ReservationResponse (
        Long orderNumber,
        Long showingId,
        String movieTitle,
        String theaterName,
        LocalDateTime startTime,
        String customerName,
        String customerEmail,
        boolean isPaid,
        List<SeatResponse> seats
)
{
    public static ReservationResponse from(Reservation reservation, List<Seat> seats) {
        return new ReservationResponse(
                reservation.getOrderNumber(),
                reservation.getShowing().getId(),
                reservation.getShowing().getMovie().getTitle(),
                reservation.getShowing().getTheater().getName(),
                reservation.getShowing().getStartTime(),
                reservation.getCustomer().getName(),
                reservation.getCustomer().getEmail(),
                reservation.isPaid(),
                seats.stream().map(SeatResponse::from).toList()
        );
    }
}
