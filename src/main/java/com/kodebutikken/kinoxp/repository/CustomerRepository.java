package com.kodebutikken.kinoxp.repository;

import com.kodebutikken.kinoxp.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer,Long> {
    Optional<Customer> findByEmail(String email);
}
