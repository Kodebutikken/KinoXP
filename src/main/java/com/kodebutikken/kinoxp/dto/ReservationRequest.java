package com.kodebutikken.kinoxp.dto;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ReservationRequest(
        @NotNull(message = "Showing is required")
        Long showingId,

        @NotEmpty(message = "At least one seat must be selected")
        List<Long> seatIds,

        @NotBlank(message = "Name is required")
        String customerName,

        @NotBlank(message = "Email is required")
        @Email(message = "Email is not valid")
        String customerEmail,

        String customerPhone,

        HttpSession session
) {
}
