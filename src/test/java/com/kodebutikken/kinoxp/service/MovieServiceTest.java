package com.kodebutikken.kinoxp.service;

import com.kodebutikken.kinoxp.dto.MovieRequest;
import com.kodebutikken.kinoxp.dto.MovieResponse;
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


import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

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
        MovieRequest movieRequest = new MovieRequest("Batman", 155, 0, "Ren action",
                MovieGenre.ACTION, null, true);

        movieService.createMovie(movieRequest);

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
    void updateMovie_success() {
        Long movieId = 1L;
        Movie existingMovie = new Movie(movieId, "Batman", 155, 0, "Ren action",
                MovieGenre.ACTION, null, true, new ArrayList<>());
        MovieRequest movieRequest = new MovieRequest("Batman Returns", 126, 18,
                "Mere action", MovieGenre.THRILLER, null, true);

        when(movieRepository.findById(movieId)).thenReturn(Optional.of(existingMovie));
        when(movieRepository.save(any(Movie.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Movie result = movieService.updateMovie(movieId, movieRequest);

        assertEquals(movieId, result.getId());
        assertEquals("Batman Returns", result.getTitle());
        assertEquals(126, result.getDurationMinutes());
        assertEquals(18, result.getAgeLimit());
        assertEquals("Mere action", result.getDescription());
        assertEquals(MovieGenre.THRILLER, result.getMovieGenre());
        assertTrue(result.isActive());
    }

    @Test
    void getAllMovies_shouldReturnAllMovies() {
        Movie batman = new Movie(1L, "Batman", 155, 0, "Ren action", MovieGenre.ACTION, null, true, new ArrayList<>());
        Movie dune = new Movie(2L, "Dune", 166, 0, "Sci-fi", MovieGenre.SCIENCE_FICTION, null, true, new ArrayList<>());

        when(movieRepository.findAll()).thenReturn(List.of(batman, dune));

        List<MovieResponse> movies = movieService.getAllMovies();

        assertEquals(2, movies.size());
        assertEquals("Batman", movies.getFirst().title());
    }

    @Test
    void getMovieById_shouldReturnMovie_whenMovieExists() {
        Long movieId = 1L;
        Movie batman = new Movie(movieId, "Batman", 155, 0, "Ren action", MovieGenre.ACTION, null, true, new ArrayList<>());

        when(movieRepository.findById(movieId)).thenReturn(Optional.of(batman));

        Movie result = movieService.getMovieById(movieId);

        assertEquals(batman, result);
    }

    @Test
    void getMovieById_shouldThrow_whenMovieDoesNotExist() {
        Long movieId = 99L;

        when(movieRepository.findById(movieId)).thenReturn(Optional.empty());

        assertThrows(MovieNotFoundException.class, () -> movieService.getMovieById(movieId));
    }

    @Test
    void createMovie_shouldThrow_whenTitleAlreadyExists() {
        MovieRequest movieRequest = new MovieRequest("Batman", 155, 0, "Ren action",
                MovieGenre.ACTION, null, true);

        when(movieRepository.existsByTitle("Batman")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> movieService.createMovie(movieRequest));

        verify(movieRepository, never()).save(any());
    }

    @Test
    void updateMovie_shouldThrow_whenTitleBelongsToAnotherMovie() {
        Long movieId = 1L;
        MovieRequest movieRequest = new MovieRequest("Dune", 126, 18, "Mere action", MovieGenre.THRILLER, null, true);

        when(movieRepository.existsByTitleAndIdNot("Dune", movieId)).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> movieService.updateMovie(movieId, movieRequest));

        verify(movieRepository, never()).save(any());
    }

    @Test
    void updateMovie_shouldThrow_whenMovieDoesNotExist() {
        Long movieId = 99L;
        MovieRequest movieRequest = new MovieRequest("Batman Returns", 126, 18, "Mere action", MovieGenre.THRILLER, null, true);

        when(movieRepository.findById(movieId)).thenReturn(Optional.empty());

        assertThrows(MovieNotFoundException.class, () -> movieService.updateMovie(movieId, movieRequest));

        verify(movieRepository, never()).save(any());
    }

    //DELETE
    @Test
    void deleteMovie_shouldDeleteMovieAndShowings_whenMovieIsInactive() {
        Long movieId = 1L;
        Movie movie = new Movie(movieId, "Batman", 155, 0, "Ren action",
                MovieGenre.ACTION, null, false, new ArrayList<>());

        when(movieRepository.findById(movieId)).thenReturn(Optional.of(movie));

        movieService.deleteMovie(movieId);

        verify(showingRepository).deleteByMovieId(movieId);
        verify(movieRepository).deleteById(movieId);
    }

    @Test
    void deleteMovie_shouldThrow_whenMovieIsActive() {
        Long movieId = 1L;
        Movie movie = new Movie(movieId, "Batman", 155, 0, "Ren action",
                MovieGenre.ACTION, null, true, new ArrayList<>());

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
        Movie movie = new Movie(movieId, "Batman", 155, 0, "Ren action", MovieGenre.ACTION, null, true, new ArrayList<>());

        when(movieRepository.findById(movieId)).thenReturn(Optional.of(movie));

        movieService.changeMovieStatus(movieId, false);

        ArgumentCaptor<Movie> movieCaptor = ArgumentCaptor.forClass(Movie.class);
        verify(movieRepository).save(movieCaptor.capture());
        assertFalse(movieCaptor.getValue().isActive());
    }

    @Test
    void changeMovieStatus_shouldActivateMovie() {
        Long movieId = 1L;
        Movie movie = new Movie(movieId, "Batman", 155, 0, "Ren action", MovieGenre.ACTION, null, false, new ArrayList<>());

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