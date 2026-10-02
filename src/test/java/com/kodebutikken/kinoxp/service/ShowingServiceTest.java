package com.kodebutikken.kinoxp.service;

import com.kodebutikken.kinoxp.dto.ShowingDto;
import com.kodebutikken.kinoxp.model.Movie;
import com.kodebutikken.kinoxp.model.MovieGenre;
import com.kodebutikken.kinoxp.model.Showing;
import com.kodebutikken.kinoxp.model.Theater;
import com.kodebutikken.kinoxp.repository.ShowingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ShowingServiceTest {

    @Mock
    private ShowingRepository showingRepository;

    @InjectMocks
    private ShowingService showingService;

    @Test
    void getShowingsForMovie_mapsEntityFieldsToDto() {
        Long movieId = 1L;
        Movie movie = new Movie(movieId, "Batman", 155, 0, "Ren action", MovieGenre.ACTION, true);
        Theater theater = new Theater(2L, "Sal 1", 10, 15);
        LocalDateTime startTime = LocalDateTime.of(2026, 1, 1, 20, 0);
        Showing showing = new Showing(3L, movie, theater, startTime, false, "SCHEDULED", List.of());

        when(showingRepository.findByMovieIdOrderByStartTimeAsc(movieId)).thenReturn(List.of(showing));

        List<ShowingDto> result = showingService.getShowingsForMovie(movieId);

        assertEquals(1, result.size());
        ShowingDto dto = result.get(0);
        assertEquals(3L, dto.id());
        assertEquals(movieId, dto.movieId());
        assertEquals("Batman", dto.movieTitle());
        assertEquals("Sal 1", dto.theaterName());
        assertEquals(startTime, dto.startTime());
        assertEquals("SCHEDULED", dto.status());
        assertFalse(dto.extra());
    }

    @Test
    void getShowingsForMovie_returnsEmptyList_whenNoShowings() {
        Long movieId = 99L;

        when(showingRepository.findByMovieIdOrderByStartTimeAsc(movieId)).thenReturn(List.of());

        List<ShowingDto> result = showingService.getShowingsForMovie(movieId);

        assertTrue(result.isEmpty());
    }
}
