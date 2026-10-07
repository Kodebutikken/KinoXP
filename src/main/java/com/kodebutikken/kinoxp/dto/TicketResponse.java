package com.kodebutikken.kinoxp.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

//Vi laver en billet pr. reservation

public record TicketResponse(
        Long orderNumber,
        String customerName,
        String movieTitle,
        String theaterName,
        LocalDateTime startTime,
        List<SeatResponse> seats,
        BigDecimal totalPrice
) {
    public static TicketResponse from(ReservationResponse reservation, BigDecimal totalPrice) {
        return new TicketResponse(
                reservation.orderNumber(),
                reservation.customerName(),
                reservation.movieTitle(),
                reservation.theaterName(),
                reservation.startTime(),
                reservation.seats(),
                totalPrice
        );
    }
}