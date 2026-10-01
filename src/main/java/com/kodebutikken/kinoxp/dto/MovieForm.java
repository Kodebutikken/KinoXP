package com.kodebutikken.kinoxp.dto;

import com.kodebutikken.kinoxp.model.MovieGenre;
import jakarta.validation.constraints.*;

public record MovieForm(
        @NotBlank(message = "Title must be filled out")
        String title,

        @NotNull(message = "Duration must be filled out")
        @Positive(message = "Duration must be a positive number")
        Integer durationMinutes,

        @NotNull(message = "Age limit must be filled out")
        @Min(value = 0, message = "Age limit must be greater than or equal to 0")
        @Max(value = 18, message = "Age limit must be less than or equal to 18")
        Integer ageLimit,

        @NotBlank(message = "Description must be filled out")
        String description,

        @NotNull(message = "Genre is required")
        MovieGenre movieGenre
) {
}