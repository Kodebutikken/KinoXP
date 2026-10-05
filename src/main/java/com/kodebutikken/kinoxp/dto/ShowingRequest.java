package com.kodebutikken.kinoxp.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record ShowingRequest(

        @NotNull(message = "Movie is required")
        Long movieId,

        @NotNull(message = "Theater is required")
        Long theaterId,

        @NotNull(message = "Start time must be filled out")
        @Future(message = "Start time must be in the future")
        LocalDateTime startTime,

        boolean extra
) {
}