package com.kodebutikken.kinoxp.service;

import com.kodebutikken.kinoxp.dto.MovieForm;
import com.kodebutikken.kinoxp.model.Movie;
import com.kodebutikken.kinoxp.repository.MovieRepository;
import org.springframework.stereotype.Service;

@Service
public class MovieService {
    private final MovieRepository movieRepository;

    public MovieService(MovieRepository movieRepository) {
        this.movieRepository = movieRepository;
    }

    public Movie createMovie(MovieForm movieForm) {
        if (movieForm == null) {
            throw new IllegalArgumentException("Ikke være 0");
        }
        String validationError = isValidMovieForm(movieForm);
        if (validationError != null) {
            throw new IllegalArgumentException(validationError);
        }
        Movie movie = new Movie();
        movie.setTitle(movieForm.title().trim());
        movie.setDurationMinutes(movieForm.durationMinutes());
        movie.setAgeLimit(movieForm.ageLimit());
        movie.setDescription(movieForm.description());

        return movieRepository.save(movie);
    }

    //Ved ikke hvad vi gør når en film ikke har en aldersgrænse, så det blev sådan her.
        private String isValidMovieForm(MovieForm movieForm) {
            if (movieForm.ageLimit() != 0 && movieForm.ageLimit() != 18) {
                return "Aldersgrænse skal være 0 eller 18";
            }

            //Der ikke må være flere film med samme titel.
            if (movieRepository.existsByTitle(movieForm.title().trim())) {
                return "Der findes allerede en film med titlen: " + movieForm.title().trim();
            }
            return null;
        }
    }

