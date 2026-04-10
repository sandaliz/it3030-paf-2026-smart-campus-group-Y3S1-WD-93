package com.sliit.uniops.controller.ticket;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import com.sliit.uniops.model.ticket.NotificationModel;
import com.sliit.uniops.service.ticket.NotificationService;

import lombok.RequiredArgsConstructor;

@RestController("ticketNotificationController")
@RequestMapping("/api/tickets/notifications")
@RequiredArgsConstructor
public class NotificationController {
     private final NotificationService notificationService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<NotificationModel>> getMyNotifications(
            @AuthenticationPrincipal OidcUser user) {
        String userId = user.getSubject();
        return ResponseEntity.ok(notificationService.getUserNotifications(userId));
    }

    @GetMapping("/unread/count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Long> getUnreadCount(@AuthenticationPrincipal OidcUser user) {
        String userId = user.getSubject();
        return ResponseEntity.ok(notificationService.getUnreadCount(userId));
    }

    @PatchMapping("/{notificationId}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> markAsRead(@PathVariable String notificationId) {
        notificationService.markNotificationAsRead(notificationId);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal OidcUser user) {
        String userId = user.getSubject();
        notificationService.markNotificationAsRead(userId);
        return ResponseEntity.ok().build();
    }
}


