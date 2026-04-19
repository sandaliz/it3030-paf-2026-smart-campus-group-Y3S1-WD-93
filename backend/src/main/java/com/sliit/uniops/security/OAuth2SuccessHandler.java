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
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

/**
 * Handler for successful OAuth2 authentication.
 * Creates or updates OAuth user and returns same JWT shape as local auth.
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
        String token = jwtUtils.generateToken(resolveJwtSubject(user), buildClaims(user));
        String redirectPath = getDashboardPath(user.getRoles());

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
                .orElseGet(() -> createNewUser(normalizedEmail, name));

        // Update existing user with role mapping
        user.setGoogleId(googleId);
        user.setEmail(normalizedEmail);
        user.setName(name == null || name.isBlank() ? user.getName() : name);
        user.setPictureUrl(picture);
        user.setAuthProvider("GOOGLE");
        user.setEnabled(true);
        user.setLastLoginAt(System.currentTimeMillis());
        
        // Update roles based on email only if no roles are currently assigned (prevents overwriting manual admin changes)
        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            Role primaryRole = roleMappingService.parseRoleFromEmail(normalizedEmail);
            user.setRoles(defaultRoles(primaryRole));
        }

        return userRepository.save(user);
    }

    private String resolveJwtSubject(User user) {
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            return user.getEmail().trim().toLowerCase();
        }

        if (user.getUsername() != null && !user.getUsername().isBlank()) {
            return user.getUsername().trim().toLowerCase();
        }

        throw new IllegalStateException("OAuth user must have an email or username to generate a JWT");
    }

    private User createNewUser(String email, String name) {
        User user = new User();
        user.setEmail(email);
        user.setUsername(generateUniqueUsername(email.split("@")[0]));
        user.setName(name == null || name.isBlank() ? email.split("@")[0] : name);
        user.setAuthProvider("GOOGLE");
        user.setEnabled(true);
        Role primaryRole = roleMappingService.parseRoleFromEmail(email);
        user.setRoles(defaultRoles(primaryRole));
        user.setCreatedAt(System.currentTimeMillis());
        user.setLastLoginAt(System.currentTimeMillis());
        return user;
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

    private String getDashboardPath(Set<Role> roles) {
        if (roles == null || roles.isEmpty()) {
            return "/dashboard";
        }

        if (roles.contains(Role.ADMIN)) return "/admin/dashboard";
        if (roles.contains(Role.BOOKING_MANAGER)) return "/admin/bookings";
        if (roles.contains(Role.TICKET_MANAGER)) return "/tickets";
        if (roles.contains(Role.RESOURCE_MANAGER)) return "/admin/resources";
        if (roles.contains(Role.LECTURER)) return "/lecturer/dashboard";
        if (roles.contains(Role.TECHNICIAN)) return "/technician/dashboard";
        if (roles.contains(Role.NON_ACADEMIC)) return "/staff/dashboard";
        return "/student/dashboard";
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

    private Set<Role> defaultRoles(Role primaryRole) {
        Set<Role> roles = new LinkedHashSet<>();
        roles.add(primaryRole);
        if (primaryRole == Role.STUDENT) {
            roles.add(Role.USER);
        }
        return roles;
    }

    private String readAttribute(OAuth2User user, String key) {
        Object value = user.getAttributes().get(key);
        return value == null ? null : value.toString();
    }
}
