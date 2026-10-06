package com.kodebutikken.kinoxp.service;

import com.kodebutikken.kinoxp.dto.LoginRequest;
import com.kodebutikken.kinoxp.dto.LoginResponse;
import com.kodebutikken.kinoxp.exception.InvalidCredentialsException;
import com.kodebutikken.kinoxp.model.Employee;
import com.kodebutikken.kinoxp.model.Role;
import com.kodebutikken.kinoxp.repository.EmployeeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    @Test
    void login_throwsInvalidCredentials_whenUsernameDoesNotExist() {
        LoginRequest request = new LoginRequest("missing-user", "password");
        when(employeeRepository.findByUsername(request.username())).thenReturn(null);

        InvalidCredentialsException exception = assertThrows(
                InvalidCredentialsException.class,
                () -> authService.login(request)
        );

        assertEquals("Invalid username or password", exception.getMessage());
        verify(passwordEncoder, never()).matches(request.password(), null);
    }

    @Test
    void login_throwsInvalidCredentials_whenPasswordDoesNotMatch() {
        LoginRequest request = new LoginRequest("employee", "wrong-password");
        Employee employee = new Employee(1L, "Employee", Role.EMPLOYEE, "employee", "stored-password-hash");

        when(employeeRepository.findByUsername(request.username())).thenReturn(employee);
        when(passwordEncoder.matches(request.password(), employee.getPassword())).thenReturn(false);

        InvalidCredentialsException exception = assertThrows(
                InvalidCredentialsException.class,
                () -> authService.login(request)
        );

        assertEquals("Invalid username or password", exception.getMessage());
    }

    @Test
    void login_returnsEmployeeDetails_whenCredentialsAreValid() {
        LoginRequest request = new LoginRequest("administrator", "correct-password");
        Employee employee = new Employee(
                7L,
                "Administrator",
                Role.ADMINISTRATOR,
                "administrator",
                "stored-password-hash"
        );

        when(employeeRepository.findByUsername(request.username())).thenReturn(employee);
        when(passwordEncoder.matches(request.password(), employee.getPassword())).thenReturn(true);

        LoginResponse response = authService.login(request);

        assertEquals(employee.getId(), response.id());
        assertEquals(employee.getUsername(), response.username());
        assertEquals(employee.getRole(), response.role());
    }
}
