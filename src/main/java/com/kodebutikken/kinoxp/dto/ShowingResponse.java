package com.kodebutikken.kinoxp.dto;

import com.kodebutikken.kinoxp.model.Showing;

import java.time.LocalDateTime;

public record ShowingResponse(
        Long id,
        Long movieId,
        String movieTitle,
        Long theaterId,
        String theaterName,
        LocalDateTime startTime,
        boolean extra
) {
    public static ShowingResponse from(Showing showing) {
        return new ShowingResponse(
                showing.getId(),
                showing.getMovie().getId(),
                showing.getMovie().getTitle(),
                showing.getTheater().getId(),
                showing.getTheater().getName(),
                showing.getStartTime(),
                showing.isExtra());
    }

}
