package com.kodebutikken.kinoxp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record MovieForm(
        @NotBlank(message = "Titel skal udfyldes")
        String title,

        @NotNull(message = "Varighed skal udfyldes")
        @Positive(message = "Varighed skal være større end 0")
        Integer durationMinutes,

        @NotNull(message = "Aldersgrænse skal udfyldes")
        Integer ageLimit,

        @NotBlank(message = "Beskrivelse skal udfyldes")
        String description
) {
}