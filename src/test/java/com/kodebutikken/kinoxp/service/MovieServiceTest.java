package com.kodebutikken.kinoxp.service;

import com.kodebutikken.kinoxp.dto.MovieForm;
import com.kodebutikken.kinoxp.model.Movie;
import com.kodebutikken.kinoxp.model.MovieGenre;
import com.kodebutikken.kinoxp.model.MovieStatus;
import com.kodebutikken.kinoxp.repository.MovieRepository;
import com.kodebutikken.kinoxp.repository.ShowingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.awt.*;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

//ALT HERINDE ER AI GENERATED

@ExtendWith(MockitoExtension.class)
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
        assertEquals(MovieStatus.ACTIVE, capturedMovie.getMovieStatus());
    }

    @Test
    void updateMovie_success() {
        Long movieId = 1L;
        Movie existingMovie = new Movie(movieId, "Batman", 155, 0, "Ren action",
                MovieGenre.ACTION, MovieStatus.ACTIVE);
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
        assertEquals(MovieStatus.ACTIVE, capturedMovie.getMovieStatus());
    }

    //DELETE
    @Test
    void deleteMovie_shouldDeleteMovieAndShowings_whenMovieIsInactive() {
        Long movieId = 1L;
        Movie movie = new Movie(movieId, "Batman", 155, 0, "Ren action",
                MovieGenre.ACTION, MovieStatus.INACTIVE);

        when(movieRepository.findById(movieId)).thenReturn(Optional.of(movie));

        movieService.deleteMovie(movieId);

        verify(showingRepository).deleteByMovieId(movieId);
        verify(movieRepository).deleteById(movieId);
    }

    @Test
    void deleteMovie_shouldThrow_whenMovieIsActive() {
        Long movieId = 1L;
        Movie movie = new Movie(movieId, "Batman", 155, 0, "Ren action",
                MovieGenre.ACTION, MovieStatus.ACTIVE);

        when(movieRepository.findById(movieId)).thenReturn(Optional.of(movie));

        assertThrows(IllegalArgumentException.class, () -> movieService.deleteMovie(movieId));

        verify(showingRepository, never()).deleteByMovieId(any());
        verify(movieRepository, never()).deleteById(any());
    }

    @Test
    void deleteMovie_shouldThrow_whenMovieDoesNotExist() {
        Long movieId = 99L;

        when(movieRepository.findById(movieId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> movieService.deleteMovie(movieId));

        verify(movieRepository, never()).deleteById(any());
    }

    //CHANGE STATUS
    @Test
    void changeMovieStatus_shouldDeactivateMovie() {
        Long movieId = 1L;
        Movie movie = new Movie(movieId, "Batman", 155, 0, "Ren action", MovieGenre.ACTION, MovieStatus.ACTIVE);

        when(movieRepository.findById(movieId)).thenReturn(Optional.of(movie));

        movieService.changeMovieStatus(movieId, MovieStatus.INACTIVE);

        ArgumentCaptor<Movie> movieCaptor = ArgumentCaptor.forClass(Movie.class);
        verify(movieRepository).save(movieCaptor.capture());
        assertEquals(MovieStatus.INACTIVE, movieCaptor.getValue().getMovieStatus());
    }

    @Test
    void changeMovieStatus_shouldActivateMovie() {
        Long movieId = 1L;
        Movie movie = new Movie(movieId, "Batman", 155, 0, "Ren action", MovieGenre.ACTION, MovieStatus.INACTIVE);

        when(movieRepository.findById(movieId)).thenReturn(Optional.of(movie));

        movieService.changeMovieStatus(movieId, MovieStatus.ACTIVE);

        ArgumentCaptor<Movie> movieCaptor = ArgumentCaptor.forClass(Movie.class);
        verify(movieRepository).save(movieCaptor.capture());
        assertEquals(MovieStatus.ACTIVE, movieCaptor.getValue().getMovieStatus());
    }

    @Test
    void changeMovieStatus_shouldThrow_whenMovieDoesNotExist() {
        Long movieId = 99L;

        when(movieRepository.findById(movieId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> movieService.changeMovieStatus(movieId, MovieStatus.INACTIVE));

        verify(movieRepository, never()).save(any());
    }
}