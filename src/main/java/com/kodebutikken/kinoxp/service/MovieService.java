package com.kodebutikken.kinoxp.service;

import com.kodebutikken.kinoxp.dto.MovieRequest;
import com.kodebutikken.kinoxp.dto.MovieResponse;
import com.kodebutikken.kinoxp.exception.MovieNotFoundException;
import com.kodebutikken.kinoxp.model.Movie;
import com.kodebutikken.kinoxp.repository.MovieRepository;
import com.kodebutikken.kinoxp.repository.ShowingRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class MovieService {
    private final MovieRepository movieRepository;
    private final ShowingRepository showingRepository;

    public MovieService(MovieRepository movieRepository, ShowingRepository showingRepository) {
        this.movieRepository = movieRepository;
        this.showingRepository = showingRepository;
    }

    public MovieResponse createMovie(MovieRequest movieRequest) {
        String validationError = isValidMovieForm(movieRequest);
        if (validationError != null) {
            throw new IllegalArgumentException(validationError);
        }
        Movie movie = new Movie();
        movie.setTitle(movieRequest.title().trim());
        movie.setDurationMinutes(movieRequest.durationMinutes());
        movie.setAgeLimit(movieRequest.ageLimit());
        movie.setDescription(movieRequest.description());
        movie.setMovieGenre(movieRequest.movieGenre());
        movie.setCoverUrl(movieRequest.coverUrl());
        movie.setActive(true);

        movieRepository.save(movie);

        return MovieResponse.from(movie);
    }

    // Der må ikke være flere film med samme titel
    private String isValidMovieForm(MovieRequest movieRequest) {
        if (movieRepository.existsByTitle(movieRequest.title().trim())) {
            return "There is already a movie with the title: " + movieRequest.title().trim();
        }
        return null;
    }

    // Titlen må ikke findes på en anden film end den, der redigeres
    private String isValidUpdatedMovieForm(Long id, MovieRequest movieRequest) {
        if (movieRepository.existsByTitleAndIdNot(movieRequest.title().trim(), id)) {
            return "There is already a movie with the title: " + movieRequest.title().trim();
        }
        return null;
    }

    public Movie updateMovie(Long id, MovieRequest movieRequest) {
        String validationError = isValidUpdatedMovieForm(id, movieRequest);
        if (validationError != null) {
            throw new IllegalArgumentException(validationError);
        }

        Movie existingMovie = getMovieById(id);

        existingMovie.setTitle(movieRequest.title().trim());
        existingMovie.setDurationMinutes(movieRequest.durationMinutes());
        existingMovie.setAgeLimit(movieRequest.ageLimit());
        existingMovie.setDescription(movieRequest.description());
        existingMovie.setCoverUrl(movieRequest.coverUrl());
        existingMovie.setMovieGenre(movieRequest.movieGenre());

        return movieRepository.save(existingMovie);
    }

    @Transactional
    public void deleteMovie(Long id) {
        //Ændret så kun film der er inaktive kan slettes
        Movie movie = getMovieById(id);

        if (movie.isActive()) {
            throw new IllegalArgumentException("Only inactive movies can be deleted");
        }
        showingRepository.deleteByMovieId(id);
        movieRepository.deleteById(id);
    }

    public Movie changeMovieStatus(Long id, boolean active) {
        Movie movie = getMovieById(id);

        movie.setActive(active);
        return movieRepository.save(movie);
    }

    public List<MovieResponse> getAllMovies() {
        List <MovieResponse> movies = new ArrayList<>();
        List <Movie> movieList = movieRepository.findAll();
        for (Movie movie : movieList) {
            movies.add(MovieResponse.from(movie));
        }
        return movies;
    }
    public Movie getMovieById(Long id) {
        return movieRepository.findById(id)
                .orElseThrow(() -> new MovieNotFoundException("Movie with id " + id + " does not exist"));
    }
}