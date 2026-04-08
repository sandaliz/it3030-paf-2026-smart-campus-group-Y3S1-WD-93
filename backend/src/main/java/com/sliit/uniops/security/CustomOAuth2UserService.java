package com.sliit.uniops.security;

import com.sliit.uniops.model.Role;
import com.sliit.uniops.model.User;
import com.sliit.uniops.repository.UserRepository;
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
        String email = (String) attributes.get("email");
        String googleId = (String) attributes.get("sub");
        String name = (String) attributes.get("name");
        String pictureUrl = (String) attributes.get("picture");

        User user = userRepository.findByEmail(email)
                .orElseGet(() -> User.builder()
                        .email(email)
                        .roles(new HashSet<>())
                        .build());

        user.setGoogleId(googleId);
        user.setName(name);
        user.setPictureUrl(pictureUrl);

        // Assign roles based on email domain if not already assigned
        if (user.getRoles().isEmpty()) {
            user.getRoles().addAll(assignRolesByEmail(email));
        }

        userRepository.save(user);
        return oAuth2User;
    }

    private Set<Role> assignRolesByEmail(String email) {
        Set<Role> roles = new HashSet<>();
        String lowercaseEmail = email.toLowerCase();

        // 1. Check dynamic role assignments from properties
        if (isEmailInList(lowercaseEmail, adminEmails)) roles.add(Role.ADMIN);
        if (isEmailInList(lowercaseEmail, studentEmails)) roles.add(Role.STUDENT);
        if (isEmailInList(lowercaseEmail, lecturerEmails)) roles.add(Role.LECTURER);
        if (isEmailInList(lowercaseEmail, staffEmails)) roles.add(Role.STAFF);
        if (isEmailInList(lowercaseEmail, technicianEmails)) roles.add(Role.TECHNICIAN);

        // 2. Fallback to domain-based assignment if no specific roles found
        if (roles.isEmpty()) {
            if (lowercaseEmail.endsWith("@admin.uni.com")) {
                roles.add(Role.ADMIN);
            } else if (lowercaseEmail.endsWith("@student.uni.com")) {
                roles.add(Role.STUDENT);
            } else if (lowercaseEmail.endsWith("@staff.uni.com")) {
                roles.add(Role.STAFF);
            } else if (lowercaseEmail.endsWith("@tech.uni.com")) {
                roles.add(Role.TECHNICIAN);
            } else if (lowercaseEmail.endsWith("@lecturer.uni.com")) {
                roles.add(Role.LECTURER);
            } else {
                roles.add(Role.USER); // Default fallback
            }
        }
        
        return roles;
    }

    private boolean isEmailInList(String email, String list) {
        if (list == null || list.trim().isEmpty()) {
            return false;
        }
        return Arrays.stream(list.split(","))
                .map(String::trim)
                .anyMatch(e -> e.equalsIgnoreCase(email));
    }
}
