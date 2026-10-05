package com.kodebutikken.kinoxp.dto;

import com.kodebutikken.kinoxp.model.Seat;

public record SeatAvailabilityResponse (
    Long id,
    int seatRow,
    int seatNumber,
    boolean booked
){
    public static SeatAvailabilityResponse from(Seat seat, boolean booked) {
        return new SeatAvailabilityResponse(seat.getId(), seat.getSeatRow(), seat.getSeatNumber(), booked);
    }
}
