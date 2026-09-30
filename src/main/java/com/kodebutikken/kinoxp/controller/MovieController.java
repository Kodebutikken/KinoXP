package com.kodebutikken.kinoxp.controller;


import com.kodebutikken.kinoxp.dto.MovieForm;
import com.kodebutikken.kinoxp.service.MovieService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/movies")
public class MovieController {
    private final MovieService movieService;

    public MovieController(MovieService movieService) {
        this.movieService = movieService;
    }

    @PostMapping
    public ResponseEntity<?> createMovie(@Valid @RequestBody MovieForm movieForm, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest()
                    .body(bindingResult.getFieldError().getDefaultMessage());
        }
        try {
            return ResponseEntity.ok(movieService.createMovie(movieForm));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/delete")
    public ResponseEntity<String> deleteMovie(@PathVariable Long id) {
        try {
            movieService.deleteMovie(id);
            return ResponseEntity.ok("FILMEN BLEVET SLETTET");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/edit")
    public ResponseEntity<String> updateMovie(@PathVariable Long id, @Valid @RequestBody MovieForm movieForm, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest()
                    .body(bindingResult.getFieldError().getDefaultMessage());
        }
        try {
            movieService.updateMovie(id, movieForm);
            return ResponseEntity.ok("Filmen er blevet opdateret");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

