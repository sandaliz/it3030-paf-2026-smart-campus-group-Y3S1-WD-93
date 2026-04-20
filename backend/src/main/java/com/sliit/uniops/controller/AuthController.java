package com.sliit.uniops.controller;

import com.sliit.uniops.dto.request.auth.LoginRequest;
import com.sliit.uniops.dto.request.auth.RegisterRequest;
import com.sliit.uniops.dto.response.auth.AuthResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sliit.uniops.model.User;
import com.sliit.uniops.security.UserPrincipal;
import com.sliit.uniops.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final ObjectMapper objectMapper;

    @Value("${spring.security.oauth2.client.registration.google.client-id:}")
    private String googleClientId;

    @Value("${spring.security.oauth2.client.registration.google.client-secret:}")
    private String googleClientSecret;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserPrincipal user) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "name", user.getName(),
                "role", user.getRole()
        ));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestBody Map<String, Object> profileData
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        try {
            User updatedUser = authService.updateProfile(user.getId(), profileData);
            return ResponseEntity.ok(Map.of(
                    "id", updatedUser.getId(),
                    "email", updatedUser.getEmail(),
                    "name", updatedUser.getName(),
                    "username", updatedUser.getUsername(),
                    "authProvider", updatedUser.getAuthProvider(),
                    "roles", updatedUser.getRoles(),
                    "enabled", updatedUser.isEnabled(),
                    "createdAt", updatedUser.getCreatedAt()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to update profile"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }

    @PostMapping("/calendar/token")
    public ResponseEntity<?> exchangeCalendarCode(@RequestBody Map<String, String> payload) {
        String code = payload.get("code");
        if (code == null || code.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Authorization code is required"));
        }

        if (googleClientId == null || googleClientId.isBlank() || googleClientSecret == null || googleClientSecret.isBlank()) {
            return ResponseEntity.status(500).body(Map.of("message", "Google Calendar OAuth is not configured"));
        }

        try {
            String form = "code=" + URLEncoder.encode(code, StandardCharsets.UTF_8)
                    + "&client_id=" + URLEncoder.encode(googleClientId, StandardCharsets.UTF_8)
                    + "&client_secret=" + URLEncoder.encode(googleClientSecret, StandardCharsets.UTF_8)
                    + "&redirect_uri=" + URLEncoder.encode(frontendUrl + "/auth/calendar/callback", StandardCharsets.UTF_8)
                    + "&grant_type=authorization_code";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://oauth2.googleapis.com/token"))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(form))
                    .build();

            HttpResponse<String> response = HttpClient.newHttpClient()
                    .send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                return ResponseEntity.ok(objectMapper.readValue(response.body(), new TypeReference<Map<String, Object>>() {}));
            }

            try {
                return ResponseEntity.status(response.statusCode())
                        .body(objectMapper.readValue(response.body(), new TypeReference<Map<String, Object>>() {}));
            } catch (Exception ignored) {
                return ResponseEntity.status(response.statusCode()).body(Map.of("message", response.body()));
            }
        } catch (Exception exception) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to exchange Google authorization code"));
        }
    }
}
