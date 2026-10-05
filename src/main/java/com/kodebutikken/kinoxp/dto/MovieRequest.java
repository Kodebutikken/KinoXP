package com.kodebutikken.kinoxp.dto;

import com.kodebutikken.kinoxp.model.MovieGenre;

public record MovieRequest(
        String title,
        Integer durationMinutes,
        Integer ageLimit,
        String description,
        MovieGenre movieGenre,
        boolean active
) {
}
