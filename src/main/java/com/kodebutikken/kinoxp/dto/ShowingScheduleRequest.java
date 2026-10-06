package com.kodebutikken.kinoxp.dto;

import java.util.List;

public record ShowingScheduleRequest(
        Long movieId,
        Long theaterId,
        boolean extra,
        List<ScheduleEntry> schedules
) {
}
