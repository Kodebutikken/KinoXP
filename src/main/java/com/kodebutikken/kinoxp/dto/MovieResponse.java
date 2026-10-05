package com.kodebutikken.kinoxp.dto;

import com.kodebutikken.kinoxp.model.Movie;

public record MovieResponse(
        Long id,
        String title,
        Integer durationMinutes,
        Integer ageLimit,
        String description,
        String movieGenre,
        boolean active
) {
    public static MovieResponse from(Movie movie) {
        return new MovieResponse(
                movie.getId(),
                movie.getTitle(),
                movie.getDurationMinutes(),
                movie.getAgeLimit(),
                movie.getDescription(),
                movie.getMovieGenre() != null ? movie.getMovieGenre().name() : null,
                movie.isActive()
        );
    }
}
