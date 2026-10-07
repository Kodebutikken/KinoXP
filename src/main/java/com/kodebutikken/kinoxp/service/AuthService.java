package com.kodebutikken.kinoxp.service;

import com.kodebutikken.kinoxp.dto.LoginRequest;
import com.kodebutikken.kinoxp.dto.LoginResponse;
import com.kodebutikken.kinoxp.exception.InvalidCredentialsException;
import com.kodebutikken.kinoxp.model.Employee;
import com.kodebutikken.kinoxp.repository.EmployeeRepository;
import jakarta.servlet.http.HttpSession;
import lombok.AllArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;


@Service
@AllArgsConstructor
public class AuthService {
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    public LoginResponse login(LoginRequest loginRequest) {
        if (loginRequest == null) {
            throw new InvalidCredentialsException("Invalid username or password");
        }
        Employee employee = employeeRepository.findByUsername(loginRequest.username());

        if (employee == null ||
                !passwordEncoder.matches(loginRequest.password(), employee.getPassword())) {
            throw new InvalidCredentialsException("Invalid username or password");
        }

        return new LoginResponse(employee.getId(), employee.getUsername(), employee.getRole());
    }

    public boolean isAdmin(HttpSession session) {
        LoginResponse loginResponse = (LoginResponse) session.getAttribute("LOGGED_IN_USER");
        return loginResponse != null && loginResponse.role().name().equals("ADMINISTRATOR");
    }

    public boolean isSessionValid(HttpSession session) {
        return session != null && session.getAttribute("LOGGED_IN_USER") != null;
    }
}
