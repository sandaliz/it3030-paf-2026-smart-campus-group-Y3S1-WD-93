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

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

/**
 * Handler for successful OAuth2 authentication.
 * Creates or updates the OAuth user and returns the same JWT shape as local auth.
 */
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;
    private final RoleMappingService roleMappingService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        User user = resolveOAuthUser(oAuth2User);
        String token = jwtUtils.generateToken(user.getUsername(), buildClaims(user));
        String redirectPath = roleMappingService.getDashboardPath(roleMappingService.getHighestPriorityRole(user.getRoles()));

        String origin = request.getHeader("Origin");
        if (origin == null || origin.isEmpty()) {
            origin = frontendUrl;
        }

        String targetUrl = UriComponentsBuilder.fromUriString(origin + "/auth/callback")
                .queryParam("token", token)
                .queryParam("redirect", redirectPath)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    private User resolveOAuthUser(OAuth2User oAuth2User) {
        String email = readAttribute(oAuth2User, "email");
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Google account email is required");
        }

        String normalizedEmail = email.trim().toLowerCase();
        String googleId = readAttribute(oAuth2User, "sub");
        String name = readAttribute(oAuth2User, "name");
        String picture = readAttribute(oAuth2User, "picture");

        User user = userRepository.findByGoogleId(googleId)
                .or(() -> userRepository.findByEmail(normalizedEmail))
                .orElseGet(() -> User.builder()
                        .email(normalizedEmail)
                        .username(generateUniqueUsername(normalizedEmail.split("@")[0]))
                        .name(name == null || name.isBlank() ? normalizedEmail.split("@")[0] : name)
                        .authProvider("GOOGLE")
                        .enabled(true)
                        .roles(defaultRoles(roleMappingService.parseRoleFromEmail(normalizedEmail)))
                        .build());

        if (user.getUsername() == null || user.getUsername().isBlank()) {
            user.setUsername(generateUniqueUsername(normalizedEmail.split("@")[0]));
        }
        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            user.setRoles(defaultRoles(roleMappingService.parseRoleFromEmail(normalizedEmail)));
        } else if (user.getRoles().contains(Role.STUDENT) && !user.getRoles().contains(Role.USER)) {
            user.getRoles().add(Role.USER);
        }

        user.setGoogleId(googleId);
        user.setEmail(normalizedEmail);
        user.setName(name == null || name.isBlank() ? user.getName() : name);
        user.setPictureUrl(picture);
        user.setAuthProvider("GOOGLE");
        user.setEnabled(true);
        user.setLastLoginAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    private Map<String, Object> buildClaims(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("username", user.getUsername());
        claims.put("email", user.getEmail());
        claims.put("name", user.getName());
        claims.put("picture", user.getPictureUrl());
        claims.put("authProvider", user.getAuthProvider());
        claims.put("roles", user.getRoles().stream().map(Role::name).toList());
        return claims;
    }

    private Set<Role> defaultRoles(Role primaryRole) {
        Set<Role> roles = new LinkedHashSet<>();
        roles.add(primaryRole);
        if (primaryRole == Role.STUDENT) {
            roles.add(Role.USER);
        }
        return roles;
    }

    private String generateUniqueUsername(String baseName) {
        String sanitized = baseName == null ? "user" : baseName.trim().toLowerCase().replaceAll("[^a-z0-9._-]", "");
        if (sanitized.isBlank()) {
            sanitized = "user";
        }

        String candidate = sanitized;
        int suffix = 1;
        while (userRepository.existsByUsername(candidate)) {
            candidate = sanitized + suffix++;
        }
        return candidate;
    }

    private String readAttribute(OAuth2User user, String key) {
        Object value = user.getAttributes().get(key);
        return value == null ? null : value.toString();
    }
}
