package com.sliit.uniops.controller;

import com.sliit.uniops.dto.request.GoogleCalendarTokenExchangeRequest;
import com.sliit.uniops.dto.request.auth.LoginRequest;
import com.sliit.uniops.dto.request.auth.RegisterRequest;
import com.sliit.uniops.dto.response.GoogleCalendarTokenResponse;
import com.sliit.uniops.dto.response.auth.AuthResponse;
import com.sliit.uniops.model.User;
import com.sliit.uniops.service.AuthService;
import com.sliit.uniops.service.GoogleCalendarOAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final GoogleCalendarOAuthService googleCalendarOAuthService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        return ResponseEntity.ok(user);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }

    @PostMapping("/calendar/token")
    public ResponseEntity<GoogleCalendarTokenResponse> exchangeCalendarCode(
        @Valid @RequestBody GoogleCalendarTokenExchangeRequest request
    ) {
        return ResponseEntity.ok(googleCalendarOAuthService.exchangeCodeForToken(request.getCode()));
    }
}
