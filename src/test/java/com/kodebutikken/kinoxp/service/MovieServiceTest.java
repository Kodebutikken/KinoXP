package com.kodebutikken.kinoxp.service;

import com.kodebutikken.kinoxp.dto.MovieForm;
import com.kodebutikken.kinoxp.model.Movie;
import com.kodebutikken.kinoxp.repository.MovieRepository;
import com.kodebutikken.kinoxp.repository.ShowingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

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
        MovieForm movieForm = new MovieForm("Batman", 155, 0, "Ren action");

        movieService.createMovie(movieForm);

        ArgumentCaptor<Movie> movieCaptor = ArgumentCaptor.forClass(Movie.class);

        verify(movieRepository).save(movieCaptor.capture());

        Movie capturedMovie = movieCaptor.getValue();

        assertEquals("Batman", capturedMovie.getTitle());
        assertEquals(155, capturedMovie.getDurationMinutes());
        assertEquals(0, capturedMovie.getAgeLimit());
        assertEquals("Ren action", capturedMovie.getDescription());
    }

    @Test
    void deleteMovie_shouldDeleteMovieAndShowings_whenMovieExists() {
        Long movieId = 1L;

        when(movieRepository.existsById(movieId)).thenReturn(true);

        movieService.deleteMovie(movieId);

        verify(showingRepository).deleteByMovieId(movieId);
        verify(movieRepository).deleteById(movieId);
    }
}