package com.kodebutikken.kinoxp.controller;

import com.kodebutikken.kinoxp.dto.LoginRequest;
import com.kodebutikken.kinoxp.dto.LoginResponse;
import com.kodebutikken.kinoxp.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@AllArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        LoginResponse loginResponse = authService.login(loginRequest);

        HttpSession session = request.getSession(true);
        session.setAttribute("LOGGED_IN_USER", loginResponse);
        session.setMaxInactiveInterval(30 * 60);

        return ResponseEntity.ok(loginResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<LoginResponse> getCurrentUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);

        if(session == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Object userObj = session.getAttribute("LOGGED_IN_USER");
        if (userObj == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        LoginResponse currentUser = (LoginResponse) userObj;
        return ResponseEntity.ok(currentUser);
    }
}
