package com.kodebutikken.kinoxp.service;

import com.kodebutikken.kinoxp.dto.LoginRequest;
import com.kodebutikken.kinoxp.dto.LoginResponse;
import com.kodebutikken.kinoxp.exception.InvalidCredentialsException;
import com.kodebutikken.kinoxp.model.Employee;
import com.kodebutikken.kinoxp.model.Role;
import com.kodebutikken.kinoxp.repository.EmployeeRepository;
import jakarta.servlet.http.HttpSession; // NY: bruges til at teste isAdmin
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse; // NY
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;  // NY
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions; // NY
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    // NY: en "falsk" session, så vi selv kan bestemme, hvem der er logget ind
    @Mock
    private HttpSession session;

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

    @Test
    void login_throwsInvalidCredentials_whenRequestIsNull() {
        InvalidCredentialsException exception = assertThrows(
                InvalidCredentialsException.class,
                () -> authService.login(null)
        );

        assertEquals("Invalid username or password", exception.getMessage());
        verifyNoInteractions(employeeRepository);
    }

    // ---------------- NY: isAdmin ----------------

    @Test
    void isAdmin_returnsFalse_whenNotLoggedIn() {
        when(session.getAttribute("username")).thenReturn(null);

        assertFalse(authService.isAdmin(session));
        verifyNoInteractions(employeeRepository);
    }

    @Test
    void isAdmin_returnsFalse_whenEmployeeDoesNotExist() {
        when(session.getAttribute("username")).thenReturn("deleted-user");
        when(employeeRepository.findByUsername("deleted-user")).thenReturn(null);

        assertFalse(authService.isAdmin(session));
    }

    @Test
    void isAdmin_returnsFalse_whenEmployeeIsNotAdministrator() {
        Employee employee = new Employee(1L, "Employee", Role.EMPLOYEE, "employee", "hash");
        when(session.getAttribute("username")).thenReturn("employee");
        when(employeeRepository.findByUsername("employee")).thenReturn(employee);

        assertFalse(authService.isAdmin(session));
    }

    @Test
    void isAdmin_returnsTrue_whenEmployeeIsAdministrator() {
        Employee admin = new Employee(7L, "Administrator", Role.ADMINISTRATOR, "administrator", "hash");
        when(session.getAttribute("username")).thenReturn("administrator");
        when(employeeRepository.findByUsername("administrator")).thenReturn(admin);

        assertTrue(authService.isAdmin(session));
    }
}