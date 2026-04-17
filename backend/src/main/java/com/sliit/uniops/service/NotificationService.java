package com.sliit.uniops.service;

import com.sliit.uniops.model.Notification;
import com.sliit.uniops.repository.NotificationRepository;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for handling notification operations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;

    /**
     * Create a new notification
     */
    public Notification createNotification(String userId, String title, String message, Notification.NotificationType type, String relatedEntityId) {
        log.info("Creating notification for user {}: {}", userId);
        
        Notification notification = Notification.builder()
                .userId(userId)
                .title(title)
                .message(message)
                .type(type)
                .relatedEntityId(relatedEntityId)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        Notification saved = notificationRepository.save(notification);
        log.info("Notification created successfully: {}", saved.getId());
        return saved;
    }

    /**
     * Get all notifications for a user
     */
    public List<Notification> getUserNotifications(String userId) {
        log.debug("Fetching notifications for user: {}", userId);
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Get unread notifications count for badge
     */
    public long getUnreadCount(String userId) {
        log.debug("Counting unread notifications for user: {}", userId);
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    /**
     * Mark a notification as read
     */
    public Notification markAsRead(String notificationId, String userId) {
        log.debug("Marking notification {} as read for user: {}", notificationId, userId);
        
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId);
        if (notification != null && !notification.getIsRead()) {
            notification.setIsRead(true);
            Notification updated = notificationRepository.save(notification);
            log.info("Notification {} marked as read", notificationId);
            return updated;
        }
        
        log.warn("Notification {} not found or already read for user: {}", notificationId, userId);
        return null;
    }

    /**
     * Mark all notifications as read for a user
     */
    public int markAllAsRead(String userId) {
        log.info("Marking all notifications as read for user: {}", userId);
        
        List<Notification> unreadNotifications = notificationRepository.findByUserIdAndIsReadFalse(userId);
        unreadNotifications.forEach(notification -> notification.setIsRead(true));
        
        List<Notification> updatedNotifications = notificationRepository.saveAll(unreadNotifications);
        log.info("Marked {} notifications as read for user: {}", updatedNotifications.size(), userId);
        return updatedNotifications.size();
    }

    /**
     * Delete a notification (user can only delete their own)
     */
    public boolean deleteNotification(String notificationId, String userId) {
        log.debug("Deleting notification {} for user: {}", notificationId, userId);
        
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId);
        if (notification != null) {
            notificationRepository.delete(notification);
            log.info("Notification {} deleted for user: {}", notificationId, userId);
            return true;
        }
        
        log.warn("Notification {} not found or access denied for user: {}", notificationId, userId);
        return false;
    }
}