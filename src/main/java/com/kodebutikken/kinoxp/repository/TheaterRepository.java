package com.kodebutikken.kinoxp.repository;

import com.kodebutikken.kinoxp.model.Theater;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TheaterRepository extends JpaRepository<Theater, Long> {
}
