package com.kodebutikken.kinoxp.repository;

import com.kodebutikken.kinoxp.model.Movie;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MovieRepository  extends JpaRepository<Movie, Long> {
    boolean existsByTitle(String title);
}
