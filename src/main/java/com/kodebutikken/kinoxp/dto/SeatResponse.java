package com.kodebutikken.kinoxp.dto;

import com.kodebutikken.kinoxp.model.Seat;

public record SeatResponse(
    Long id,
    int seatRow,
    int seatNumber
) {
    public static SeatResponse from(Seat seat) {
        return new SeatResponse(
            seat.getId(),
            seat.getSeatRow(),
            seat.getSeatNumber()
        );
    }
}