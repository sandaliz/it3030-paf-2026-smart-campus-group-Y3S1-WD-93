package com.sliit.uniops.security;

import com.sliit.uniops.model.Role;
import com.sliit.uniops.model.User;
import com.sliit.uniops.repository.UserRepository;
import com.sliit.uniops.service.RoleMappingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final RoleMappingService roleMappingService;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        
        String email = oAuth2User.getAttribute("email");
        if (email == null || email.isBlank()) {
            throw new OAuth2AuthenticationException("Email is required for OAuth2 authentication");
        }

        String normalizedEmail = email.trim().toLowerCase();
        String googleId = oAuth2User.getAttribute("sub");
        
        User user = userRepository.findByGoogleId(googleId)
                .or(() -> userRepository.findByEmail(normalizedEmail))
                .orElseGet(() -> createNewOAuthUser(normalizedEmail, googleId, oAuth2User));

        updateOAuthUser(user, googleId, oAuth2User);
        userRepository.save(user);

        return oAuth2User;
    }

    private User createNewOAuthUser(String email, String googleId, OAuth2User oAuth2User) {
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");
        
        Role primaryRole = roleMappingService.parseRoleFromEmail(email);
        Set<Role> roles = defaultRoles(primaryRole);
        
        return User.builder()
                .email(email)
                .username(generateUniqueUsername(email.split("@")[0]))
                .name(name != null && !name.isBlank() ? name : email.split("@")[0])
                .googleId(googleId)
                .pictureUrl(picture)
                .authProvider("GOOGLE")
                .enabled(true)
                .roles(roles)
                .lastLoginAt(LocalDateTime.now())
                .build();
    }

    private void updateOAuthUser(User user, String googleId, OAuth2User oAuth2User) {
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");
        
        user.setGoogleId(googleId);
        user.setName(name != null && !name.isBlank() ? name : user.getName());
        user.setPictureUrl(picture);
        user.setAuthProvider("GOOGLE");
        user.setEnabled(true);
        user.setLastLoginAt(LocalDateTime.now());
        
        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            Role primaryRole = roleMappingService.parseRoleFromEmail(user.getEmail());
            user.setRoles(defaultRoles(primaryRole));
        }
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
}
