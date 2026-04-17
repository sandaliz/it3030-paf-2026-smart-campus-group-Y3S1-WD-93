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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Custom service to handle user info retrieval and role assignment during OAuth2 login.
 */
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Value("${auth.admins:}")
    private String adminEmails;

    @Value("${auth.students:}")
    private String studentEmails;

    @Value("${auth.lecturers:}")
    private String lecturerEmails;

    @Value("${auth.staff:}")
    private String staffEmails;

    @Value("${auth.technicians:}")
    private String technicianEmails;

    private final RoleMappingService roleMappingService;

    @jakarta.annotation.PostConstruct
    public void init() {
        System.out.println("=================================================");
        System.out.println("UniOps Auth System V2 (Google ID + Normalization) Active");
        System.out.println("=================================================");
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        
        try {
            return processOAuth2User(oAuth2User);
        } catch (Exception ex) {
            throw new OAuth2AuthenticationException(ex.getMessage());
        }
    }

    private OAuth2User processOAuth2User(OAuth2User oAuth2User) {
        Map<String, Object> attributes = oAuth2User.getAttributes();
        String rawEmail = (String) attributes.get("email");
        String email = rawEmail != null ? rawEmail.toLowerCase().trim() : null;
        String googleId = (String) attributes.get("sub");
        String name = (String) attributes.get("name");
        String pictureUrl = (String) attributes.get("picture");

        if (email == null || googleId == null) {
            throw new RuntimeException("Essential user data missing from Google response");
        }

        System.out.println("Processing login for: " + email + " (Google ID: " + googleId + ")");

        // 1. Try to find user by Google ID first (Most reliable)
        // 2. Fallback to Email search
        User user = userRepository.findByGoogleId(googleId)
                .or(() -> userRepository.findByEmail(email))
                .orElseGet(() -> {
                    System.out.println("Creating new User document for: " + email);
                    return User.builder()
                        .email(email)
                        .roles(new HashSet<>())
                        .enabled(true)
                        .createdAt(java.time.LocalDateTime.now())
                        .build();
                });

        // Always sync the latest details
        user.setEmail(email);
        user.setGoogleId(googleId);
        user.setName(name);
        user.setPictureUrl(pictureUrl);
        user.setLastLoginAt(java.time.LocalDateTime.now());

        // Always update/sync roles based on email mapping to ensure correct dashboard redirection
        Set<Role> roles = new HashSet<>();
        boolean isFirstUser = userRepository.count() == 0;
        
        if (isFirstUser && (user.getRoles() == null || user.getRoles().isEmpty())) {
            System.out.println("First system user detected. Assigning ADMIN role.");
            roles.add(Role.ADMIN);
        } else {
            Role identifiedRole = roleMappingService.parseRoleFromEmail(email);
            System.out.println("Identified role for " + email + ": " + identifiedRole);
            roles.add(identifiedRole);
        }
        
        user.setRoles(roles);

        User savedUser = userRepository.save(user);
        System.out.println("Successfully saved/updated user: " + savedUser.getEmail() + " with roles: " + savedUser.getRoles());
        
        return oAuth2User;
    }
}
