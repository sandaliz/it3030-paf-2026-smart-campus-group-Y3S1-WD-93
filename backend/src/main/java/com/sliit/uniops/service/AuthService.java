package com.sliit.uniops.service;

import com.sliit.uniops.dto.request.auth.LoginRequest;
import com.sliit.uniops.dto.request.auth.RegisterRequest;
import com.sliit.uniops.dto.response.auth.AuthResponse;
import com.sliit.uniops.model.Role;
import com.sliit.uniops.model.User;
import com.sliit.uniops.repository.UserRepository;
import com.sliit.uniops.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final RoleMappingService roleMappingService;

    public AuthResponse register(RegisterRequest request) {
        String username = normalizeUsername(request.getUsername());
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username is already taken");
        }
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email is already registered");
        }

        User user = User.builder()
                .name(request.getName().trim())
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .authProvider("LOCAL")
                .enabled(true)
                .roles(defaultRoles(request.getRole()))
                .lastLoginAt(System.currentTimeMillis())
                .build();

        user = userRepository.save(user);
        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword())
            );
        } catch (DisabledException ex) {
            throw new IllegalStateException("Your account is disabled");
        } catch (BadCredentialsException ex) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));
        user.setLastLoginAt(System.currentTimeMillis());
        user = userRepository.save(user);
        return buildAuthResponse(user);
    }

    public AuthResponse loginWithGoogle(OAuth2User oAuth2User) {
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
        user.setLastLoginAt(System.currentTimeMillis());

        user = userRepository.save(user);
        return buildAuthResponse(user);
    }

    public AuthResponse buildAuthResponse(User user) {
        String token = jwtUtils.generateToken(resolveJwtSubject(user), buildClaims(user));
        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .name(user.getName())
                .pictureUrl(user.getPictureUrl())
                .authProvider(user.getAuthProvider())
                .roles(user.getRoles())
                .redirectPath(roleMappingService.getDashboardPath(roleMappingService.getHighestPriorityRole(user.getRoles())))
                .build();
    }

    private String resolveJwtSubject(User user) {
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            return user.getEmail().trim().toLowerCase();
        }

        if (user.getUsername() != null && !user.getUsername().isBlank()) {
            return user.getUsername().trim().toLowerCase();
        }

        throw new IllegalStateException("User must have an email or username to generate a JWT");
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

    private String normalizeUsername(String username) {
        return username == null ? null : username.trim().toLowerCase();
    }

    private String generateUniqueUsername(String baseName) {
        String sanitized = normalizeUsername(baseName).replaceAll("[^a-z0-9._-]", "");
        if (sanitized == null || sanitized.isBlank()) {
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
