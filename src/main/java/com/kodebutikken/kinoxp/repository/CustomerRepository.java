package com.kodebutikken.kinoxp.repository;

import com.kodebutikken.kinoxp.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer,Long> {
}
