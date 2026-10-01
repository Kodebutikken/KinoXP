package com.kodebutikken.kinoxp.dto;

import com.kodebutikken.kinoxp.model.MovieGenre;
import jakarta.validation.constraints.*;

public record MovieForm(
        @NotBlank(message = "Titel skal udfyldes")
        String title,

        @NotNull(message = "Varighed skal udfyldes")
        @Positive(message = "Varighed skal være større end 0")
        Integer durationMinutes,

        @NotNull(message = "Aldersgrænse skal udfyldes")
        @Min(value = 0, message = "Aldersgrænse skal være større end eller lig med 0")
        @Max(value = 18, message = "Aldersgrænse skal være mindre end eller lig med 18")
        Integer ageLimit,

        @NotBlank(message = "Beskrivelse skal udfyldes")
        String description,

        @NotNull(message = "Genre is required")
        MovieGenre movieGenre
) {
}