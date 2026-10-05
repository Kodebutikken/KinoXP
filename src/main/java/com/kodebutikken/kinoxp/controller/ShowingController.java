package com.kodebutikken.kinoxp.controller;

import com.kodebutikken.kinoxp.dto.ShowingRequest;
import com.kodebutikken.kinoxp.dto.ShowingResponse;
import com.kodebutikken.kinoxp.model.Showing;
import com.kodebutikken.kinoxp.service.ShowingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/showings")
public class ShowingController {
    private final ShowingService showingService;

    public ShowingController(ShowingService showingService) {
        this.showingService = showingService;
    }

    @GetMapping
    public ResponseEntity<List<ShowingResponse>> getShowingsForMovie(
            @RequestParam Long movieId) {

        return ResponseEntity.ok(
                showingService.getShowingsForMovie(movieId)
        );
    }

    @PostMapping
    public ResponseEntity<ShowingResponse> createShowing(
            @Valid @RequestBody ShowingRequest showingRequest) {

        ShowingResponse createdShowing =
                showingService.createShowing(showingRequest);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(createdShowing);
    }

    @PutMapping("/{id}/edit")
    public ResponseEntity<Showing> updateShowing(@PathVariable Long id,
                                                 @Valid @RequestBody ShowingRequest showingRequest) {
        Showing showing = showingService.updateShowing(id, showingRequest);
        return ResponseEntity.ok(showing);
    }
}