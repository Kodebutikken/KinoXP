package com.kodebutikken.kinoxp.service;

import com.kodebutikken.kinoxp.dto.ShowingRequest;
import com.kodebutikken.kinoxp.dto.ShowingResponse;
import com.kodebutikken.kinoxp.exception.MovieNotFoundException;
import com.kodebutikken.kinoxp.exception.ShowingConflictException;
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
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

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

    private Movie movie(Long id, int durationMinutes) {
        return new Movie(id, "Batman", durationMinutes, 0, "Ren action", MovieGenre.ACTION, null, true);
    }

    private Theater theater(Long id) {
        return new Theater(id, "Sal 1", 10, 15);
    }

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


    @Test
    void createShowing_success_whenTheaterIsFree() {
        LocalDateTime start = LocalDateTime.of(2030, 1, 1, 20, 0);
        when(movieRepository.findById(1L)).thenReturn(Optional.of(movie(1L, 120)));
        when(theaterRepository.findById(2L)).thenReturn(Optional.of(theater(2L)));
        when(showingRepository.findByTheaterId(2L)).thenReturn(List.of());

        ShowingResponse result = showingService.createShowing(new ShowingRequest(1L, 2L, start, true));

        assertEquals(1L, result.movieId());
        assertEquals(2L, result.theaterId());
        assertEquals(start, result.startTime());
        assertTrue(result.extra());
        verify(showingRepository).save(any(Showing.class));
    }

    @Test
    void createShowing_shouldThrow_whenShowingOverlaps() {
        Showing existing = new Showing(9L, movie(5L, 155), theater(2L),
                LocalDateTime.of(2030, 1, 1, 20, 0), false, List.of());
        when(movieRepository.findById(1L)).thenReturn(Optional.of(movie(1L, 120)));
        when(theaterRepository.findById(2L)).thenReturn(Optional.of(theater(2L)));
        when(showingRepository.findByTheaterId(2L)).thenReturn(List.of(existing));

        ShowingRequest request = new ShowingRequest(1L, 2L, LocalDateTime.of(2030, 1, 1, 22, 30), false);

        assertThrows(ShowingConflictException.class, () -> showingService.createShowing(request));
        verify(showingRepository, never()).save(any());
    }

    @Test
    void createShowing_shouldThrow_whenShowingStartsInsideBuffer() {
        Showing existing = new Showing(9L, movie(5L, 155), theater(2L),
                LocalDateTime.of(2030, 1, 1, 20, 0), false, List.of());
        when(movieRepository.findById(1L)).thenReturn(Optional.of(movie(1L, 120)));
        when(theaterRepository.findById(2L)).thenReturn(Optional.of(theater(2L)));
        when(showingRepository.findByTheaterId(2L)).thenReturn(List.of(existing));

        ShowingRequest request = new ShowingRequest(1L, 2L, LocalDateTime.of(2030, 1, 1, 22, 40), false);

        assertThrows(ShowingConflictException.class, () -> showingService.createShowing(request));
    }

    @Test
    void createShowing_success_whenShowingStartsRightAfterBuffer() {
        Showing existing = new Showing(9L, movie(5L, 155), theater(2L),
                LocalDateTime.of(2030, 1, 1, 20, 0), false, List.of());
        when(movieRepository.findById(1L)).thenReturn(Optional.of(movie(1L, 120)));
        when(theaterRepository.findById(2L)).thenReturn(Optional.of(theater(2L)));
        when(showingRepository.findByTheaterId(2L)).thenReturn(List.of(existing));

        ShowingRequest request = new ShowingRequest(1L, 2L, LocalDateTime.of(2030, 1, 1, 22, 45), false);

        assertDoesNotThrow(() -> showingService.createShowing(request));
        verify(showingRepository).save(any(Showing.class));
    }

    @Test
    void createShowing_shouldThrow_whenMovieDoesNotExist() {
        when(movieRepository.findById(1L)).thenReturn(Optional.empty());

        ShowingRequest request = new ShowingRequest(1L, 2L, LocalDateTime.of(2030, 1, 1, 20, 0), false);

        assertThrows(MovieNotFoundException.class, () -> showingService.createShowing(request));
    }

    @Test
    void createShowing_shouldThrow_whenTheaterDoesNotExist() {
        when(movieRepository.findById(1L)).thenReturn(Optional.of(movie(1L, 120)));
        when(theaterRepository.findById(2L)).thenReturn(Optional.empty());

        ShowingRequest request = new ShowingRequest(1L, 2L, LocalDateTime.of(2030, 1, 1, 20, 0), false);

        assertThrows(IllegalArgumentException.class, () -> showingService.createShowing(request));
    }
}