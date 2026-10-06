package com.kodebutikken.kinoxp.dto;

import java.time.DayOfWeek;
import java.time.LocalTime;

public record ScheduleEntry(
        DayOfWeek day,
        LocalTime time
) {
}
