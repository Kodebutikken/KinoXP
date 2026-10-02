package com.kodebutikken.kinoxp.service;

import com.kodebutikken.kinoxp.dto.ShowingDto;
import com.kodebutikken.kinoxp.model.Showing;
import com.kodebutikken.kinoxp.repository.ShowingRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ShowingService {
    private final ShowingRepository showingRepository;

    public ShowingService(ShowingRepository showingRepository) {
        this.showingRepository = showingRepository;
    }

    public List<ShowingDto> getShowingsForMovie(Long movieId) {
        return showingRepository.findByMovieIdOrderByStartTimeAsc(movieId)
                .stream()
                .map(ShowingService::toDto)
                .toList();
    }

    private static ShowingDto toDto(Showing showing) {
        return new ShowingDto(
                showing.getId(),
                showing.getMovie().getId(),
                showing.getMovie().getTitle(),
                showing.getTheater().getName(),
                showing.getStartTime(),
                showing.getStatus(),
                showing.isExtra()
        );
    }
}
