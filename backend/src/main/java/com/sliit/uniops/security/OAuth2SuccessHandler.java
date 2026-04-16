package com.sliit.uniops.security;

import com.sliit.uniops.model.Role;
import com.sliit.uniops.model.User;
import com.sliit.uniops.repository.UserRepository;
import com.sliit.uniops.service.RoleMappingService;
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

import java.util.Optional;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Handler for successful OAuth2 authentication.
 * Generates a JWT and redirects to the frontend with role-based redirection.
 */
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;
    private final RoleMappingService roleMappingService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String rawEmail = (String) oAuth2User.getAttributes().get("email");
        String email = rawEmail != null ? rawEmail.toLowerCase().trim() : null;
        String googleId = (String) oAuth2User.getAttributes().get("sub");

        // Use the same robust lookup logic: Google ID first, then Email
        // Add a retry loop to handle potential MongoDB Atlas latency (Read-After-Write lag)
        User user = null;
        int maxRetries = 3;
        for (int i = 0; i < maxRetries; i++) {
            Optional<User> userOpt = userRepository.findByGoogleId(googleId)
                    .or(() -> userRepository.findByEmail(email));
            
            if (userOpt.isPresent()) {
                user = userOpt.get();
                break;
            }
            
            if (i < maxRetries - 1) {
                System.out.println("User not found yet for: " + email + ". Retrying in 300ms... (Attempt " + (i + 1) + ")");
                try { Thread.sleep(300); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            }
        }

        if (user == null) {
            throw new RuntimeException("User not found after OAuth success (even after retries) for: " + email);
        }

        // Prepare claims for the JWT
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", user.getRoles().stream().map(Enum::name).collect(Collectors.toList()));
        claims.put("name", user.getName());
        claims.put("picture", user.getPictureUrl());

        // 2. Identify role from the User object (DB) OR directly from email (Zero Latency fallback)
        Role highestRole = roleMappingService.getHighestPriorityRole(user.getRoles());
        
        System.out.println("DEBUG: User email: " + email);
        System.out.println("DEBUG: User roles from DB: " + user.getRoles());
        System.out.println("DEBUG: Highest role from DB: " + highestRole);
        
        // Final sanity check: if DB role is still STUDENT but email contains Admin keywords, force it here
        if (highestRole == Role.STUDENT) {
            highestRole = roleMappingService.parseRoleFromEmail(email);
            System.out.println("DEBUG: Zero-latency role override triggered: " + highestRole);
        }

        String dashboardPath = roleMappingService.getDashboardPath(highestRole);
        System.out.println("DEBUG: Final dashboard path: " + dashboardPath);

        // 3. Dynamic origin detection (Port 5173 vs 5174)
        String origin = request.getHeader("Origin");
        if (origin == null || origin.isEmpty()) {
            origin = frontendUrl; // Default fallback
        }

        // Generate the token
        String token = jwtUtils.generateToken(user.getEmail(), claims);

        System.out.println("Redirecting User [" + email + "] to: " + origin + "/auth/callback with path: " + dashboardPath);

        // Redirect to central auth callback
        String targetUrl = UriComponentsBuilder.fromUriString(origin + "/auth/callback")
                .queryParam("token", token)
                .queryParam("redirect", dashboardPath)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
