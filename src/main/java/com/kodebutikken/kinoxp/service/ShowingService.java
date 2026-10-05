package com.kodebutikken.kinoxp.service;

import com.kodebutikken.kinoxp.dto.ShowingRequest;
import com.kodebutikken.kinoxp.dto.ShowingResponse;
import com.kodebutikken.kinoxp.model.Movie;
import com.kodebutikken.kinoxp.model.Showing;
import com.kodebutikken.kinoxp.model.Theater;
import com.kodebutikken.kinoxp.repository.MovieRepository;
import com.kodebutikken.kinoxp.repository.ShowingRepository;
import com.kodebutikken.kinoxp.repository.TheaterRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ShowingService {
    private final ShowingRepository showingRepository;
    private final MovieRepository movieRepository;
    private final TheaterRepository theaterRepository;

    public ShowingService(ShowingRepository showingRepository, MovieRepository movieRepository,
                          TheaterRepository theaterRepository) {
        this.showingRepository = showingRepository;
        this.movieRepository = movieRepository;
        this.theaterRepository = theaterRepository;
    }

    public List<ShowingResponse> getShowingsForMovie(Long movieId) {
        return showingRepository.findByMovieIdOrderByStartTimeAsc(movieId)
                .stream()
                .map(ShowingResponse::from)
                .toList();
    }

    public ShowingResponse createShowing(ShowingRequest showingRequest) {
        if(showingRequest == null) {
            throw new IllegalArgumentException("Can't be 0");
        }

        String validationError = isValidShowingForm(showingRequest);

        if (validationError != null) {
            throw new IllegalArgumentException(validationError);
        }

        Movie movie = movieRepository.findById(showingRequest.movieId())
                .orElseThrow(() -> new IllegalArgumentException("Movie not found"));

        Theater theater = theaterRepository.findById(showingRequest.theaterId())
                .orElseThrow(() -> new IllegalArgumentException("Theater not found"));

        Showing showing = new Showing();

        showing.setMovie(movie);
        showing.setTheater(theater);
        showing.setStartTime(showingRequest.startTime());
        showing.setExtra(showingRequest.extra());

        showingRepository.save(showing);

        return ShowingResponse.from(showing);

    }

    private String isValidShowingForm(ShowingRequest showingRequest) {

        if (showingRequest.movieId() == null) {
            return "Movie must be selected";
        }

        if (showingRequest.theaterId() == null) {
            return "Theater must be selected";
        }

        if (showingRequest.startTime() == null) {
            return "Start time must be filled out";
        }

        if (showingRequest.startTime().isBefore(LocalDateTime.now())) {
            return "Start time must be in the future";
        }

        return null;
    }
}
