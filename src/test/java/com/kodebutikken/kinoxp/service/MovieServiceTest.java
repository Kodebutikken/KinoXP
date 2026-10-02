package com.kodebutikken.kinoxp.service;

import com.kodebutikken.kinoxp.dto.MovieForm;
import com.kodebutikken.kinoxp.exception.MovieNotFoundException;
import com.kodebutikken.kinoxp.model.Movie;
import com.kodebutikken.kinoxp.model.MovieGenre;
import com.kodebutikken.kinoxp.repository.MovieRepository;
import com.kodebutikken.kinoxp.repository.ShowingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

//ALT HERINDE ER AI GENERATED

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class MovieServiceTest {

    @Mock
    private MovieRepository movieRepository;

    @Mock
    private ShowingRepository showingRepository;

    @InjectMocks
    private MovieService movieService;


    @Test
    void createMovie_success() {
        MovieForm movieForm = new MovieForm("Batman", 155, 0, "Ren action",
                MovieGenre.ACTION);

        movieService.createMovie(movieForm);

        ArgumentCaptor<Movie> movieCaptor = ArgumentCaptor.forClass(Movie.class);
        verify(movieRepository).save(movieCaptor.capture());
        Movie capturedMovie = movieCaptor.getValue();

        assertEquals("Batman", capturedMovie.getTitle());
        assertEquals(155, capturedMovie.getDurationMinutes());
        assertEquals(0, capturedMovie.getAgeLimit());
        assertEquals("Ren action", capturedMovie.getDescription());
        assertEquals(MovieGenre.ACTION, capturedMovie.getMovieGenre());
        assertTrue(capturedMovie.isActive());
    }

    @Test
    void deleteMovie_shouldNotDeleteMovie_whenMovieDoesNotExist() {
        Long movieId = 1L;

        when(movieRepository.existsById(movieId)).thenReturn(false);

        assertThrows(MovieNotFoundException.class, () -> movieService.deleteMovie(movieId));

        verify(showingRepository, never()).deleteByMovieId(anyLong());
        verify(movieRepository, never()).deleteById(anyLong());
    }

    @Test
    void updateMovie_success() {
        Long movieId = 1L;
        Movie existingMovie = new Movie(movieId, "Batman", 155, 0, "Ren action",
                MovieGenre.ACTION, true);
        MovieForm movieForm = new MovieForm("Batman Returns", 126, 18,
                "Mere action", MovieGenre.THRILLER);

        when(movieRepository.findById(movieId)).thenReturn(Optional.of(existingMovie));
        movieService.updateMovie(movieId, movieForm);
        ArgumentCaptor<Movie> movieCaptor = ArgumentCaptor.forClass(Movie.class);
        verify(movieRepository).save(movieCaptor.capture());
        Movie capturedMovie = movieCaptor.getValue();

        assertEquals(movieId, capturedMovie.getId());
        assertEquals("Batman Returns", capturedMovie.getTitle());
        assertEquals(126, capturedMovie.getDurationMinutes());
        assertEquals(18, capturedMovie.getAgeLimit());
        assertEquals("Mere action", capturedMovie.getDescription());
        assertEquals(MovieGenre.THRILLER, capturedMovie.getMovieGenre());
        assertTrue(capturedMovie.isActive());
    }

    //DELETE
    @Test
    void deleteMovie_shouldDeleteMovieAndShowings_whenMovieIsInactive() {
        Long movieId = 1L;
        Movie movie = new Movie(movieId, "Batman", 155, 0, "Ren action",
                MovieGenre.ACTION, false);

        when(movieRepository.findById(movieId)).thenReturn(Optional.of(movie));

        movieService.deleteMovie(movieId);

        verify(showingRepository).deleteByMovieId(movieId);
        verify(movieRepository).deleteById(movieId);
    }

    @Test
    void deleteMovie_shouldThrow_whenMovieIsActive() {
        Long movieId = 1L;
        Movie movie = new Movie(movieId, "Batman", 155, 0, "Ren action",
                MovieGenre.ACTION, true);

        when(movieRepository.findById(movieId)).thenReturn(Optional.of(movie));

        assertThrows(IllegalArgumentException.class, () -> movieService.deleteMovie(movieId));

        verify(showingRepository, never()).deleteByMovieId(any());
        verify(movieRepository, never()).deleteById(any());
    }

    @Test
    void deleteMovie_shouldThrow_whenMovieDoesNotExist() {
        Long movieId = 99L;

        when(movieRepository.findById(movieId)).thenReturn(Optional.empty());

        assertThrows(MovieNotFoundException.class, () -> movieService.deleteMovie(movieId));

        verify(movieRepository, never()).deleteById(any());
    }

    //CHANGE STATUS
    @Test
    void changeMovieStatus_shouldDeactivateMovie() {
        Long movieId = 1L;
        Movie movie = new Movie(movieId, "Batman", 155, 0, "Ren action", MovieGenre.ACTION, true);

        when(movieRepository.findById(movieId)).thenReturn(Optional.of(movie));

        movieService.changeMovieStatus(movieId, false);

        ArgumentCaptor<Movie> movieCaptor = ArgumentCaptor.forClass(Movie.class);
        verify(movieRepository).save(movieCaptor.capture());
        assertFalse(movieCaptor.getValue().isActive());
    }

    @Test
    void changeMovieStatus_shouldActivateMovie() {
        Long movieId = 1L;
        Movie movie = new Movie(movieId, "Batman", 155, 0, "Ren action", MovieGenre.ACTION, false);

        when(movieRepository.findById(movieId)).thenReturn(Optional.of(movie));

        movieService.changeMovieStatus(movieId, true);

        ArgumentCaptor<Movie> movieCaptor = ArgumentCaptor.forClass(Movie.class);
        verify(movieRepository).save(movieCaptor.capture());
        assertTrue(movieCaptor.getValue().isActive());
    }

    @Test
    void changeMovieStatus_shouldThrow_whenMovieDoesNotExist() {
        Long movieId = 99L;

        when(movieRepository.findById(movieId)).thenReturn(Optional.empty());

        assertThrows(MovieNotFoundException.class,
                () -> movieService.changeMovieStatus(movieId, false));

        verify(movieRepository, never()).save(any());
    }
}