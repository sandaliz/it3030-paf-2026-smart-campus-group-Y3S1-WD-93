package com.sliit.uniops.controller;

import com.sliit.uniops.model.Notification;
import com.sliit.uniops.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for notification REST endpoints.
 * Note: Authentication is temporarily removed and will be re-added with the new auth approach.
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * Get all notifications for a user by email.
     */
    @GetMapping
    public ResponseEntity<List<Notification>> getMyNotifications(@RequestParam String email) {
        return ResponseEntity.ok(notificationService.getNotificationsForUser(email));
    }

    /**
     * Get unread notification count.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(@RequestParam String email) {
        return ResponseEntity.ok(notificationService.getUnreadCount(email));
    }

    /**
     * Mark a specific notification as read.
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable String id) {
        notificationService.markAsRead(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Mark all notifications as read for a user.
     */
    @PostMapping("/mark-all-read")
    public ResponseEntity<Void> markAllAsRead(@RequestParam String email) {
        notificationService.markAllAsRead(email);
        return ResponseEntity.noContent().build();
    }
}
