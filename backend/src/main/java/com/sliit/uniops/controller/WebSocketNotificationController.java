package com.sliit.uniops.controller;

import com.sliit.uniops.model.Notification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

/**
 * WebSocket controller for real-time notification broadcasting
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketNotificationController {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Broadcast notification to specific user
     * This method can be called from services to send real-time notifications
     */
    public void sendNotificationToUser(String userId, Notification notification) {
        try {
            String destination = "/topic/notifications/" + userId;
            messagingTemplate.convertAndSend(destination, notification);
            log.info("Notification sent via WebSocket to user {}: {}", userId, notification.getId());
        } catch (Exception e) {
            log.error("Failed to send WebSocket notification to user {}: {}", userId, e.getMessage(), e);
        }
    }

    /**
     * Handle client connection confirmation (optional)
     */
    @MessageMapping("/connect")
    public void handleConnect(String message) {
        log.info("Client connected: {}", message);
    }

    /**
     * Broadcast to all users (admin notifications)
     */
    @MessageMapping("/broadcast")
    @SendTo("/topic/notifications/all")
    public Notification broadcastNotification(Notification notification) {
        log.info("Broadcasting notification to all users: {}", notification.getId());
        return notification;
    }
}
