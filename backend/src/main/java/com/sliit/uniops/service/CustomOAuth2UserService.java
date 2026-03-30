package com.sliit.uniops.service;

import com.sliit.uniops.model.User;
import com.sliit.uniops.model.Role;
import com.sliit.uniops.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {
    
    private final UserRepository userRepository;
    
    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        
        // Extract user info from Google
        Map<String, Object> attributes = oAuth2User.getAttributes();
        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");
        String picture = (String) attributes.get("picture");
        String googleId = (String) attributes.get("sub");
        
        // Check if user exists
        User user = userRepository.findByEmail(email).orElse(null);
        
        if (user == null) {
            // Create new user
            Role assignedRole = determineRole(email);
            
            user = User.builder()
                .email(email)
                .name(name)
                .picture(picture)
                .googleId(googleId)
                .role(assignedRole)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .lastLoginAt(LocalDateTime.now())
                .build();
            
            user = userRepository.save(user);
            log.info("New user created: {} with role: {}", email, assignedRole);
        } else {
            // Update existing user
            user.setName(name);
            user.setPicture(picture);
            user.setLastLoginAt(LocalDateTime.now());
            user = userRepository.save(user);
            log.info("User logged in: {}", email);
        }
        
        // Create custom attributes map with user info
        Map<String, Object> customAttributes = new HashMap<>(attributes);
        customAttributes.put("userId", user.getId());
        customAttributes.put("userRole", user.getRole().getValue());
        
        return new DefaultOAuth2User(
            oAuth2User.getAuthorities(),
            customAttributes,
            "email"
        );
    }
    
    private Role determineRole(String email) {
        // Admin emails (you can configure these)
        if (email.equals("admin@campus.edu") || email.endsWith("@admin.campus.edu")) {
            return Role.ADMIN;
        }
        
        // Technician emails (you can configure these)
        if (email.endsWith("@tech.campus.edu") || email.matches(".*tech.*@campus.edu")) {
            return Role.TECHNICIAN;
        }
        
        // Default role
        return Role.USER;
    }
}
