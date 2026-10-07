package com.kodebutikken.kinoxp.service;

import com.kodebutikken.kinoxp.dto.ScheduleEntry;
import com.kodebutikken.kinoxp.dto.ShowingRequest;
import com.kodebutikken.kinoxp.dto.ShowingResponse;
import com.kodebutikken.kinoxp.dto.ShowingScheduleRequest;
import com.kodebutikken.kinoxp.exception.MovieNotFoundException;
import com.kodebutikken.kinoxp.exception.ShowingConflictException;
import com.kodebutikken.kinoxp.exception.ShowingNotFoundException;
import com.kodebutikken.kinoxp.model.Movie;
import com.kodebutikken.kinoxp.model.Showing;
import com.kodebutikken.kinoxp.model.Theater;
import com.kodebutikken.kinoxp.repository.MovieRepository;
import com.kodebutikken.kinoxp.repository.ReservationRepository;
import com.kodebutikken.kinoxp.repository.ShowingRepository;
import com.kodebutikken.kinoxp.repository.TheaterRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ShowingService {
    private final ShowingRepository showingRepository;
    private final MovieRepository movieRepository;
    private final TheaterRepository theaterRepository;
    private final ReservationRepository reservationRepository;

    public ShowingService(ShowingRepository showingRepository, MovieRepository movieRepository,
                          TheaterRepository theaterRepository, ReservationRepository reservationRepository) {
        this.showingRepository = showingRepository;
        this.movieRepository = movieRepository;
        this.theaterRepository = theaterRepository;
        this.reservationRepository = reservationRepository;
    }

    public List<ShowingResponse> getShowingsForMovie(Long movieId) {
        return showingRepository.findByMovieIdOrderByStartTimeAsc(movieId)
                .stream()
                .map(ShowingResponse::from)
                .toList();
    }

    public ShowingResponse createShowing(ShowingRequest showingRequest) {

        Movie movie = movieRepository.findById(showingRequest.movieId())
                .orElseThrow(() ->
                        new MovieNotFoundException("Movie not found"));

        Theater theater = theaterRepository.findById(showingRequest.theaterId())
                .orElseThrow(() ->
                        new IllegalArgumentException("Theater not found"));

        if(showingRepository.existsByTheaterIdAndStartTime(showingRequest.theaterId(), showingRequest.startTime())) {
            throw new ShowingConflictException("There is already a showing in this theater at this time.");
        }

        Showing showing = new Showing();

        showing.setMovie(movie);
        showing.setTheater(theater);
        showing.setStartTime(showingRequest.startTime());
        showing.setExtra(showingRequest.extra());

        showingRepository.save(showing);

        return ShowingResponse.from(showing);
    }

    public Showing updateShowing(Long id, ShowingRequest showingRequest) {
        if(showingRequest == null) {
            throw new IllegalArgumentException("Showing request cannot be empty");
        }

        Showing existingShowing = showingRepository.findById(id)
                .orElseThrow(() -> new ShowingNotFoundException("Showing with id " + id + "does not exist"));

        Movie movie = movieRepository.findById(showingRequest.movieId())
                .orElseThrow(() ->
                        new MovieNotFoundException("Movie not found"));

        Theater theater = theaterRepository.findById(showingRequest.theaterId())
                .orElseThrow(() ->
                        new IllegalArgumentException("Theater not found"));

        if(showingRepository.existsByTheaterIdAndStartTime(showingRequest.theaterId(), showingRequest.startTime())) {
            throw new ShowingConflictException("There is already a showing in this theater at this time.");
        }

        existingShowing.setMovie(movie);
        existingShowing.setTheater(theater);
        existingShowing.setStartTime(showingRequest.startTime());
        existingShowing.setExtra(showingRequest.extra());

        return showingRepository.save(existingShowing);
    }

    @Transactional
    public void deleteShowing(Long id) {
        Showing showing = showingRepository.findById(id)
                .orElseThrow(() -> new ShowingNotFoundException("Showing with id " + id + "does not exist"));

        if (showing.getStartTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException(
                    "A showing in the past cannot be deleted"
            );
        }
        showingRepository.deleteById(id);
        reservationRepository.deleteByShowingId(id);
    }

    public List<ShowingResponse> generateShowings(
            ShowingScheduleRequest request) {

        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate.plusMonths(3);

        List<ShowingResponse> generatedShowings = new ArrayList<>();

        for (ScheduleEntry schedule : request.schedules()) {

            for (LocalDate date = startDate;
                 !date.isAfter(endDate);
                 date = date.plusDays(1)) {

                // Hvis ugedagen ikke passer, går vi videre
                if (date.getDayOfWeek() != schedule.day()) {
                    continue;
                }

                LocalDateTime startTime =
                        LocalDateTime.of(date, schedule.time());

                ShowingRequest showingRequest = new ShowingRequest(
                        request.movieId(),
                        request.theaterId(),
                        startTime,
                        request.extra()
                );
                try {
                    ShowingResponse showing = createShowing(showingRequest);
                    generatedShowings.add(showing);

                } catch (ShowingConflictException e) {
                }
            }
        }

        return generatedShowings;
    }
}
