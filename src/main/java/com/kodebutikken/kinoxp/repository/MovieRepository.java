package com.kodebutikken.kinoxp.repository;

import com.kodebutikken.kinoxp.model.Movie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MovieRepository  extends JpaRepository<Movie, Long> {
    boolean existsByTitle(String title);

    boolean existsByTitleAndIdNot(String title, Long id);
}
