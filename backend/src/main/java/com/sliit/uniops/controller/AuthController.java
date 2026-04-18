package com.sliit.uniops.controller;

import com.sliit.uniops.dto.request.GoogleCalendarTokenExchangeRequest;
import com.sliit.uniops.dto.response.GoogleCalendarTokenResponse;
import com.sliit.uniops.service.GoogleCalendarOAuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final GoogleCalendarOAuthService googleCalendarOAuthService;

    public AuthController(GoogleCalendarOAuthService googleCalendarOAuthService) {
        this.googleCalendarOAuthService = googleCalendarOAuthService;
    }

    @PostMapping("/calendar/token")
    public ResponseEntity<GoogleCalendarTokenResponse> exchangeCalendarCode(
        @Valid @RequestBody GoogleCalendarTokenExchangeRequest request
    ) {
        return ResponseEntity.ok(googleCalendarOAuthService.exchangeCodeForToken(request.getCode()));
    }
}
