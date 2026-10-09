package com.kodebutikken.kinoxp.controller;

import com.kodebutikken.kinoxp.dto.MovieRequest;
import com.kodebutikken.kinoxp.dto.MovieResponse;
import com.kodebutikken.kinoxp.model.Movie;
import com.kodebutikken.kinoxp.model.MovieGenre;
import com.kodebutikken.kinoxp.service.MovieService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/movies")
public class MovieController {
    private final MovieService movieService;

    public MovieController(MovieService movieService) {
        this.movieService = movieService;
    }

    @GetMapping
    public ResponseEntity<List<MovieResponse>> getAllMovies() {
        return ResponseEntity.ok(movieService.getAllMovies());
    }


    @GetMapping ("/{id}")
    public ResponseEntity<MovieResponse> getMovieById(@PathVariable Long id) {
        return ResponseEntity.ok(MovieResponse.from(movieService.getMovieById(id)));
    }

    @GetMapping ("/genres")
    public ResponseEntity<MovieGenre[]> getGenres() {
        return ResponseEntity.ok(MovieGenre.values());
    }

    @PostMapping("/create")
    public ResponseEntity<MovieResponse> createMovie(@Valid @RequestBody MovieRequest movieRequest) {
        MovieResponse createdMovie = movieService.createMovie(movieRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdMovie);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMovie(@PathVariable Long id) {
        movieService.deleteMovie(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping ("/{id}/edit")
    public ResponseEntity<MovieResponse> updateMovie(@PathVariable Long id, @Valid @RequestBody MovieRequest movieRequest) {
        Movie movie = movieService.updateMovie(id, movieRequest);
        return ResponseEntity.ok(MovieResponse.from(movie));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<MovieResponse> changeMovieStatus(@PathVariable Long id, @RequestParam boolean active){
            Movie movie = movieService.changeMovieStatus(id, active);
            return ResponseEntity.ok(MovieResponse.from(movie));
    }
}

