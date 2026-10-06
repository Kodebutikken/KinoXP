package com.kodebutikken.kinoxp.exception;

// kastes når en reservation allerede er betalt (og billetten derfor allerede er lavet).

public class ReservationAlreadyPaidException extends RuntimeException {
    public ReservationAlreadyPaidException(String message) {
        super(message);
    }
}