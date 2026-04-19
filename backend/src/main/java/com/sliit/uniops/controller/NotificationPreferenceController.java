package com.sliit.uniops.controller;

import com.sliit.uniops.model.NotificationPreference;
import com.sliit.uniops.service.NotificationPreferenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for notification preference operations
 */
@RestController
@RequestMapping("/api/notification-preferences")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class NotificationPreferenceController {

    private final NotificationPreferenceService preferenceService;

    /**
     * GET /api/notification-preferences -> get current user's notification preferences
     */
    @GetMapping
    public ResponseEntity<NotificationPreference> getUserPreferences() {
        log.debug("Getting notification preferences");
        String userId = getCurrentUserId();
        log.debug("Current user ID: {}", userId);
        if (userId == null) {
            log.warn("No authenticated user found for notification preferences request");
            return ResponseEntity.badRequest().build();
        }
        
        NotificationPreference preferences = preferenceService.getUserPreferences(userId);
        log.info("Retrieved notification preferences for user: {}", userId);
        return ResponseEntity.ok(preferences);
    }

    /**
     * PUT /api/notification-preferences -> update current user's notification preferences
     */
    @PutMapping
    public ResponseEntity<NotificationPreference> updatePreferences(@RequestBody NotificationPreference preferences) {
        log.debug("Updating notification preferences");
        log.debug("Received preferences: {}", preferences);
        String userId = getCurrentUserId();
        log.debug("Current user ID: {}", userId);
        if (userId == null) {
            log.warn("No authenticated user found for notification preferences update request");
            return ResponseEntity.badRequest().build();
        }
        
        // Ensure the preferences are for the current user
        preferences.setUserId(userId);
        
        NotificationPreference updated = preferenceService.updatePreferences(userId, preferences);
        log.info("Updated notification preferences for user: {}", userId);
        return ResponseEntity.ok(updated);
    }

    /**
     * GET /api/notification-preferences/check/{type} -> check if user should receive notification of type
     * Query params: channel=email or channel=bell
     */
    @GetMapping("/check/{type}")
    public ResponseEntity<Boolean> checkNotificationPreference(
            @PathVariable String type,
            @RequestParam String channel) {
        
        String userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        
        boolean shouldSend = switch (channel.toLowerCase()) {
            case "email" -> preferenceService.shouldSendEmailNotification(userId, type.toUpperCase());
            case "bell" -> preferenceService.shouldSendBellNotification(userId, type.toUpperCase());
            default -> false;
        };
        
        log.debug("Notification preference check for user {}, type {}, channel {}: {}", 
                userId, type, channel, shouldSend);
        return ResponseEntity.ok(shouldSend);
    }

    /**
     * Get current authenticated user ID from security context
     */
    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        log.debug("Authentication object: {}", authentication);
        if (authentication != null) {
            log.debug("Authentication name: {}", authentication.getName());
            log.debug("Authentication authorities: {}", authentication.getAuthorities());
            log.debug("Is authenticated: {}", authentication.isAuthenticated());
            
            String username = authentication.getName();
            System.out.println("DEBUG: NotificationPreferenceController - authentication.getName(): " + username);
            
            // If subject is null, try to get username from authentication details
            if (username == null || username.trim().isEmpty()) {
                System.out.println("DEBUG: NotificationPreferenceController - subject is null, checking authentication details");
                // Try to get user from authentication details
                if (authentication.getDetails() instanceof org.springframework.security.oauth2.core.user.OAuth2User) {
                    org.springframework.security.oauth2.core.user.OAuth2User oauthUser = (org.springframework.security.oauth2.core.user.OAuth2User) authentication.getDetails();
                    username = oauthUser.getAttribute("email");
                    System.out.println("DEBUG: NotificationPreferenceController - username from OAuth2User: " + username);
                }
            }
            
            if (authentication.isAuthenticated()) {
                return username;
            }
        }
        return null;
    }
}
