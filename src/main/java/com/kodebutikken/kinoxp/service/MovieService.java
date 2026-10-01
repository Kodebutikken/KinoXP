package com.kodebutikken.kinoxp.service;

import com.kodebutikken.kinoxp.dto.MovieForm;
import com.kodebutikken.kinoxp.exception.MovieNotFoundException;
import com.kodebutikken.kinoxp.model.Movie;
import com.kodebutikken.kinoxp.repository.MovieRepository;
import com.kodebutikken.kinoxp.repository.ShowingRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
public class MovieService {
    private final MovieRepository movieRepository;
    private final ShowingRepository showingRepository;

    public MovieService(MovieRepository movieRepository, ShowingRepository showingRepository) {
        this.movieRepository = movieRepository;
        this.showingRepository = showingRepository;
    }

    public Movie createMovie(MovieForm movieForm) {
        if (movieForm == null) {
            throw new IllegalArgumentException("Cant be 0");
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

        //Tilføjet genre og status
        movie.setMovieGenre(movieForm.movieGenre());
        //Sætter nye film til aktiv
        movie.setActive(true);

        return movieRepository.save(movie);
    }

    public void updateMovie(Long id, MovieForm movieForm) {
        if (movieForm == null) {
            throw new IllegalArgumentException("Cant be 0");
        }
        String validationError = isValidUpdatedMovieForm(id, movieForm);
        if (validationError != null) {
            throw new IllegalArgumentException(validationError);
        }

        Movie existingMovie = movieRepository.findById(id)
                .orElseThrow(() -> new MovieNotFoundException("Movie with id " + id + " does not exist"));
        existingMovie.setTitle(movieForm.title().trim());
        existingMovie.setDurationMinutes(movieForm.durationMinutes());
        existingMovie.setAgeLimit(movieForm.ageLimit());
        existingMovie.setDescription(movieForm.description());

        //Tilføjet at man kan sætte genre
        existingMovie.setMovieGenre(movieForm.movieGenre());

        movieRepository.save(existingMovie);
    }

    @Transactional
    public void deleteMovie(Long id) {
        //Ændret så kun film der er inaktive kan slettes
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new MovieNotFoundException("Movie with the id " + id +
                        " does not exist"));
        if (movie.isActive()) {
            throw new IllegalArgumentException("Only inactive movies can be deleted");
        }
        showingRepository.deleteByMovieId(id);
        movieRepository.deleteById(id);
    }
//        if (!movieRepository.existsById(id)) {
//            throw new IllegalArgumentException("Film med id " + id + " findes ikke");
//        }
//
//        // Slet alle showings for filmen, før filmen slettes (ved sku ikke om vi skal slette showings, men det gør vi nu.)
//        showingRepository.deleteByMovieId(id);
//        movieRepository.deleteById(id);
//    }

    //Ved ikke hvad vi gør når en film ikke har en aldersgrænse, så det blev sådan her.
    private String isValidMovieForm(MovieForm movieForm) {
        //Der ikke må være flere film med samme titel.
        if (movieRepository.existsByTitle(movieForm.title().trim())) {
            return "There is already a movie with the title: " + movieForm.title().trim();
        }
        return null;
    }

    //KUNNE VÆRE EN DEL AF isValidMovieForm, MEN HAR GJORT SÅDAN HER SÅ VI KAN TJEKKE OM FILMEN ER DEN SAMME SOM VI REDIGERER.
    private String isValidUpdatedMovieForm(Long id, MovieForm movieForm) {
        //Titlen må ikke findes på en anden film end den, der redigeres.
        if (movieRepository.existsByTitleAndIdNot(movieForm.title().trim(), id)) {
            return "There is already a movie with the title: " + movieForm.title().trim();
        }
        return null;
    }

    public Movie changeMovieStatus(Long id, boolean active) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new MovieNotFoundException("Movie with id "
                        + id + " does not exist"));
        movie.setActive(active);
        return movieRepository.save(movie);
    }
}