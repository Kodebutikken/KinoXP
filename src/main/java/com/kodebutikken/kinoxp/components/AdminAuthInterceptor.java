package com.kodebutikken.kinoxp.components;

import com.kodebutikken.kinoxp.dto.LoginResponse;
import com.kodebutikken.kinoxp.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AdminAuthInterceptor implements HandlerInterceptor {

    @Autowired
    private AuthService authService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if(request.getMethod().equalsIgnoreCase("OPTIONS")) {
            return true;
        }

        HttpSession session = request.getSession(false);

        if(session != null) {
            LoginResponse loginResponse = (LoginResponse) session.getAttribute("LOGGED_IN_USER");
            if (loginResponse != null && loginResponse.role().equals("ADMINISTRATOR")) {
                return true;
            }
        }
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        return false;
    }
}
