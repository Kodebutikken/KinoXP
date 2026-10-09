package com.kodebutikken.kinoxp.service;

import com.kodebutikken.kinoxp.dto.ShowingResponse;
import com.kodebutikken.kinoxp.dto.ShowingRequest;
import com.kodebutikken.kinoxp.model.Movie;
import com.kodebutikken.kinoxp.model.MovieGenre;
import com.kodebutikken.kinoxp.model.Showing;
import com.kodebutikken.kinoxp.model.Theater;
import com.kodebutikken.kinoxp.repository.MovieRepository;
import com.kodebutikken.kinoxp.repository.ShowingRepository;
import com.kodebutikken.kinoxp.repository.TheaterRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ShowingServiceTest {

    @Mock
    private ShowingRepository showingRepository;

    @Mock
    private MovieRepository movieRepository;

    @Mock
    private TheaterRepository theaterRepository;

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
                true,
                new ArrayList<>()
        );

        Theater theater = new Theater(
                2L,
                "Sal 1",
                10,
                15,
                new ArrayList<>()
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

        ShowingResponse response = result.getFirst();

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

    @Test
    void updateShowing_returnsMappedResponse() {
        Long showingId = 3L;
        Long movieId = 1L;
        Long theaterId = 2L;
        LocalDateTime startTime = LocalDateTime.of(2026, 11, 1, 20, 0);

        Movie movie = new Movie(
                movieId,
                "Batman",
                155,
                0,
                "Ren action",
                MovieGenre.ACTION,
                null,
                true,
                new ArrayList<>()
        );
        Theater theater = new Theater(
                theaterId,
                "Sal 1",
                10,
                15,
                new ArrayList<>()
        );
        Showing existingShowing = new Showing(
                showingId,
                movie,
                theater,
                startTime.minusDays(1),
                false,
                new ArrayList<>()
        );
        ShowingRequest request = new ShowingRequest(
                movieId,
                theaterId,
                startTime,
                true
        );

        when(showingRepository.findById(showingId)).thenReturn(Optional.of(existingShowing));
        when(movieRepository.findById(movieId)).thenReturn(Optional.of(movie));
        when(theaterRepository.findById(theaterId)).thenReturn(Optional.of(theater));
        when(showingRepository.existsByTheaterIdAndStartTime(theaterId, startTime)).thenReturn(false);
        when(showingRepository.save(existingShowing)).thenReturn(existingShowing);

        ShowingResponse response = showingService.updateShowing(showingId, request);

        assertEquals(showingId, response.id());
        assertEquals(movieId, response.movieId());
        assertEquals("Batman", response.movieTitle());
        assertEquals(theaterId, response.theaterId());
        assertEquals("Sal 1", response.theaterName());
        assertEquals(startTime, response.startTime());
        assertTrue(response.extra());
    }
}
