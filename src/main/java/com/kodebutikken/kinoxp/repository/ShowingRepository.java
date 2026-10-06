package com.kodebutikken.kinoxp.repository;

import com.kodebutikken.kinoxp.model.Showing;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ShowingRepository extends JpaRepository<Showing, Long> {

    void deleteByMovieId(Long movieId);

    @EntityGraph(attributePaths = {"movie", "theater"})
    List<Showing> findByMovieIdOrderByStartTimeAsc(Long movieId);

    List<Showing> findByMovieIdOrderByStartTimeAsc(Long movieId);

    void deleteByMovieId(Long movieId);

    boolean existsByTheaterIdAndStartTime(
            Long theaterId,
            LocalDateTime startTime
    );
}