package com.kodebutikken.kinoxp.dto;

import com.kodebutikken.kinoxp.model.Role;

public record LoginResponse(
        Long id,
        String username,
        Role role
) {
}
