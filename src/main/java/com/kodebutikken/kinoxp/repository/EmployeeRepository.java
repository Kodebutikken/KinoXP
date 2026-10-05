package com.kodebutikken.kinoxp.repository;

import com.kodebutikken.kinoxp.model.Employee;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmployeeRepository extends CrudRepository<Employee, Long> {
    Employee findByUsername(String username);
}
