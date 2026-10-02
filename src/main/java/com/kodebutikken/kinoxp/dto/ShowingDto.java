package com.kodebutikken.kinoxp.dto;

import java.time.LocalDateTime;

public record ShowingDto(
        Long id,
        Long movieId,
        String movieTitle,
        String theaterName,
        LocalDateTime startTime,
        String status,
        boolean extra
) {
}
