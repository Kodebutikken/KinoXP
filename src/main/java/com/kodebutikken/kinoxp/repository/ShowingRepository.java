package com.kodebutikken.kinoxp.repository;

import com.kodebutikken.kinoxp.model.Showing;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShowingRepository extends JpaRepository<Showing, Long> {

    void deleteByMovieId(Long movieId);

    @EntityGraph(attributePaths = {"movie", "theater"})
    List<Showing> findByMovieIdOrderByStartTimeAsc(Long movieId);
}