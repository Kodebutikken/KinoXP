package com.kodebutikken.kinoxp.repository;

import com.kodebutikken.kinoxp.model.Showing;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ShowingRepository extends JpaRepository<Showing, Long> {

    @EntityGraph(attributePaths = {"movie", "theater"})
    List<Showing> findByMovieIdOrderByStartTimeAsc(Long movieId);

    List<Showing> findByTheaterId(Long theaterId);
}
