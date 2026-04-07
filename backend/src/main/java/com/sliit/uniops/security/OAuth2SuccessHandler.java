package com.sliit.uniops.security;

import com.sliit.uniops.model.User;
import com.sliit.uniops.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Handler for successful OAuth2 authentication.
 * Generates a JWT and redirects to the frontend.
 */
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = (String) oAuth2User.getAttributes().get("email");

        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found after OAuth success"));

        // Prepare claims for the JWT
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", user.getRoles().stream().map(Enum::name).collect(Collectors.toList()));
        claims.put("name", user.getName());
        claims.put("picture", user.getPictureUrl());

        // Generate the token
        String token = jwtUtils.generateToken(user.getEmail(), claims);

        // Redirect to frontend with token as a query parameter
        String targetUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/auth/callback")
                .queryParam("token", token)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
