package com.sliit.uniops.controller;

import com.sliit.uniops.model.Notification;
import com.sliit.uniops.model.User;
import com.sliit.uniops.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for notification operations.
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * 1. GET /api/notifications → get current user's notifications
     */
    @GetMapping
    public ResponseEntity<List<Notification>> getUserNotifications() {
        String userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        
        List<Notification> notifications = notificationService.getUserNotifications(userId);
        log.info("Retrieved {} notifications for user: {}", notifications.size(), userId);
        return ResponseEntity.ok(notifications);
    }

    /**
     * 2. GET /api/notifications/unread-count → get unread count for badge
     */
    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount() {
        String userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        
        long unreadCount = notificationService.getUnreadCount(userId);
        log.info("Unread count for user {}: {}", unreadCount, userId);
        return ResponseEntity.ok().body(Map.of("count", unreadCount));
    }

    /**
     * 3. PUT /api/notifications/{id}/read → mark as read
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(@PathVariable String id) {
        String userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        
        Notification notification = notificationService.markAsRead(id, userId);
        if (notification != null) {
            log.info("Notification {} marked as read by user: {}", id, userId);
            return ResponseEntity.ok(notification);
        } else {
            log.warn("Failed to mark notification {} as read for user: {}", id, userId);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * 4. DELETE /api/notifications/{id} → delete notification
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable String id) {
        String userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        
        boolean deleted = notificationService.deleteNotification(id, userId);
        if (deleted) {
            log.info("Notification {} deleted by user: {}", id, userId);
            return ResponseEntity.noContent().build();
        } else {
            log.warn("Failed to delete notification {} for user: {}", id, userId);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * 5. PUT /api/notifications/read-all → mark all as read
     */
    @PutMapping("/read-all")
    public ResponseEntity<Integer> markAllAsRead() {
        String userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        
        int markedCount = notificationService.markAllAsRead(userId);
        log.info("Marked {} notifications as read for user: {}", markedCount, userId);
        return ResponseEntity.ok(markedCount);
    }

    /**
     * Get current authenticated user ID from security context
     */
    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            String username = authentication.getName();
            System.out.println("DEBUG: NotificationController - authentication.getName(): " + username);
            
            // If subject is null, try to get username from authentication details
            if (username == null || username.trim().isEmpty()) {
                System.out.println("DEBUG: NotificationController - subject is null, checking authentication details");
                // Try to get user from authentication details
                if (authentication.getDetails() instanceof org.springframework.security.oauth2.core.user.OAuth2User) {
                    org.springframework.security.oauth2.core.user.OAuth2User oauthUser = (org.springframework.security.oauth2.core.user.OAuth2User) authentication.getDetails();
                    username = oauthUser.getAttribute("email");
                    System.out.println("DEBUG: NotificationController - username from OAuth2User: " + username);
                }
            }
            
            return username;
        }
        return null;
    }
}
