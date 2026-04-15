package com.sliit.uniops.service;

import com.sliit.uniops.model.Notification;
import com.sliit.uniops.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service to handle notification business logic and real-time delivery.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Creates a new notification, saves it, and sends it via WebSockets.
     */
    public Notification createNotification(String userId, String message, String type, String referenceId) {
        Notification notification = Notification.builder()
                .userId(userId)
                .message(message)
                .type(type)
                .status("UNREAD")
                .createdAt(LocalDateTime.now())
                .referenceId(referenceId)
                .build();

        Notification savedNotification = notificationRepository.save(notification);

        // Send real-time notification via WebSocket
        // Destination: /topic/notifications/{userId}
        try {
            messagingTemplate.convertAndSend("/topic/notifications/" + userId, savedNotification);
            log.info("Sent real-time notification to user: {}", userId);
        } catch (Exception e) {
            log.error("Failed to send real-time notification", e);
        }

        return savedNotification;
    }

    public List<Notification> getNotificationsForUser(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndStatus(userId, "UNREAD");
    }

    public void markAsRead(String id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setStatus("READ");
            notificationRepository.save(n);
        });
    }

    public void markAllAsRead(String userId) {
        List<Notification> unread = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        unread.forEach(n -> {
            if ("UNREAD".equals(n.getStatus())) {
                n.setStatus("READ");
                notificationRepository.save(n);
            }
        });
    }
}