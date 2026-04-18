package com.sliit.uniops.service;

import com.sliit.uniops.dto.response.GoogleCalendarTokenResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
public class GoogleCalendarOAuthService {

    private static final String GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

    private final RestClient restClient;

    @Value("${google.calendar.oauth.client-id:${GOOGLE_CLIENT_ID:}}")
    private String clientId;

    @Value("${google.calendar.oauth.client-secret:${GOOGLE_CLIENT_SECRET:}}")
    private String clientSecret;

    @Value("${google.calendar.oauth.redirect-uri:http://localhost:5173/auth/calendar/callback}")
    private String redirectUri;

    public GoogleCalendarOAuthService(RestClient.Builder restClientBuilder) {
        this.restClient = restClientBuilder.build();
    }

    public GoogleCalendarTokenResponse exchangeCodeForToken(String code) {
        validateConfiguration();

        MultiValueMap<String, String> requestBody = new LinkedMultiValueMap<>();
        requestBody.add("code", code);
        requestBody.add("client_id", clientId);
        requestBody.add("client_secret", clientSecret);
        requestBody.add("redirect_uri", redirectUri);
        requestBody.add("grant_type", "authorization_code");

        Map<String, Object> response = restClient.post()
            .uri(GOOGLE_TOKEN_URL)
            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
            .body(requestBody)
            .retrieve()
            .body(Map.class);

        if (response == null || response.get("access_token") == null) {
            throw new IllegalStateException("Google token exchange did not return an access token");
        }

        return new GoogleCalendarTokenResponse(
            response.get("access_token").toString(),
            response.get("refresh_token") != null ? response.get("refresh_token").toString() : null,
            response.get("expires_in") instanceof Number number ? number.longValue() : null,
            response.get("scope") != null ? response.get("scope").toString() : null,
            response.get("token_type") != null ? response.get("token_type").toString() : null
        );
    }

    private void validateConfiguration() {
        if (clientId == null || clientId.isBlank()) {
            throw new IllegalStateException("Google Calendar client ID is not configured");
        }
        if (clientSecret == null || clientSecret.isBlank()) {
            throw new IllegalStateException("Google Calendar client secret is not configured");
        }
        if (redirectUri == null || redirectUri.isBlank()) {
            throw new IllegalStateException("Google Calendar redirect URI is not configured");
        }
    }
}
