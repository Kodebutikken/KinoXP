package com.kodebutikken.kinoxp.controller;

import com.kodebutikken.kinoxp.dto.ShowingDto;
import com.kodebutikken.kinoxp.service.ShowingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/showings")
public class ShowingController {
    private final ShowingService showingService;

    public ShowingController(ShowingService showingService) {
        this.showingService = showingService;
    }

    @GetMapping
    public ResponseEntity<List<ShowingDto>> getShowingsForMovie(@RequestParam Long movieId) {
        return ResponseEntity.ok(showingService.getShowingsForMovie(movieId));
    }
}
