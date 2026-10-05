package com.kodebutikken.kinoxp.dto;

import com.kodebutikken.kinoxp.model.Movie;
import com.kodebutikken.kinoxp.model.Theater;

import java.time.LocalDateTime;

public record ShowingRequest(
        Long movieId,
        Long theaterId,
        LocalDateTime startTime,
        boolean extra
) {
}
