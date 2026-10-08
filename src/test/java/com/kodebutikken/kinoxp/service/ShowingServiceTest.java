package com.kodebutikken.kinoxp.service;

import com.kodebutikken.kinoxp.dto.ShowingResponse;
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
    void getShowingsForMovie_mapsEntityFieldsToResponse() {
        Long movieId = 1L;

        Movie movie = new Movie(
                movieId,
                "Batman",
                155,
                0,
                "Ren action",
                MovieGenre.ACTION,
                null,
                true
        );

        Theater theater = new Theater(
                2L,
                "Sal 1",
                10,
                15
        );

        LocalDateTime startTime = LocalDateTime.of(2026, 1, 1, 20, 0);

        Showing showing = new Showing(
                3L,
                movie,
                theater,
                startTime,
                false,
                List.of()
        );

        when(showingRepository.findByMovieIdOrderByStartTimeAsc(movieId))
                .thenReturn(List.of(showing));

        List<ShowingResponse> result =
                showingService.getShowingsForMovie(movieId);

        assertEquals(1, result.size());

        ShowingResponse response = result.get(0);

        assertEquals(3L, response.id());
        assertEquals(movieId, response.movieId());
        assertEquals("Batman", response.movieTitle());
        assertEquals(2L, response.theaterId());
        assertEquals("Sal 1", response.theaterName());
        assertEquals(startTime, response.startTime());
        assertFalse(response.extra());
    }

    @Test
    void getShowingsForMovie_returnsEmptyList_whenNoShowings() {
        Long movieId = 99L;

        when(showingRepository.findByMovieIdOrderByStartTimeAsc(movieId))
                .thenReturn(List.of());

        List<ShowingResponse> result =
                showingService.getShowingsForMovie(movieId);

        assertTrue(result.isEmpty());
    }
}