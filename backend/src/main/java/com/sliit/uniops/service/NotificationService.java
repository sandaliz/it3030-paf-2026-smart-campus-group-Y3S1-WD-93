package com.sliit.uniops.service;

import com.sliit.uniops.controller.WebSocketNotificationController;
import com.sliit.uniops.model.Notification;
import com.sliit.uniops.repository.NotificationRepository;
import com.sliit.uniops.service.NotificationPreferenceService;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for handling notification operations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final WebSocketNotificationController webSocketController;
    private final NotificationPreferenceService preferenceService;

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
        
        // Check user preferences before sending WebSocket notification
        boolean shouldSendBell = preferenceService.shouldSendBellNotification(userId, type.name());
        if (shouldSendBell) {
            webSocketController.sendNotificationToUser(userId, saved);
            log.info("WebSocket notification sent to user: {}", userId);
        } else {
            log.info("WebSocket notification skipped for user {} due to preferences", userId);
        }
        
        // TODO: Add email notification logic here based on preferences
        // boolean shouldSendEmail = preferenceService.shouldSendEmailNotification(userId, type.name());
        
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

    /**
     * Get notification analytics for admin dashboard
     */
    public Map<String, Object> getNotificationAnalytics(String timeRange) {
        log.info("Fetching notification analytics for time range: {}", timeRange);
        
        // Calculate date range
        LocalDateTime endDate = LocalDateTime.now();
        LocalDateTime startDate;
        
        switch (timeRange) {
            case "7d":
                startDate = endDate.minusDays(7);
                break;
            case "30d":
                startDate = endDate.minusDays(30);
                break;
            case "90d":
                startDate = endDate.minusDays(90);
                break;
            default:
                startDate = endDate.minusDays(30);
                break;
        }
        
        // Get all notifications in date range
        List<Notification> notifications = notificationRepository.findByCreatedAtBetween(startDate, endDate);
        
        // Calculate metrics
        long totalNotifications = notifications.size();
        long readNotifications = notifications.stream()
                .mapToLong(n -> n.getIsRead() ? 1 : 0)
                .sum();
        double readRate = totalNotifications > 0 ? (double) readNotifications / totalNotifications * 100 : 0;
        
        // Group by type
        Map<String, Long> notificationsByType = notifications.stream()
                .collect(Collectors.groupingBy(
                    n -> n.getType().name(),
                    Collectors.counting()
                ));
        
        // Group by user and find most active users
        Map<String, Long> userNotificationCounts = notifications.stream()
                .collect(Collectors.groupingBy(
                    Notification::getUserId,
                    Collectors.counting()
                ));
        
        // Get user details for most active users (top 5)
        List<Map<String, Object>> mostActiveUsers = userNotificationCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(entry -> {
                    Map<String, Object> userStats = new HashMap<>();
                    userStats.put("userId", entry.getKey());
                    userStats.put("notificationCount", entry.getValue());
                    userStats.put("name", "User " + entry.getKey().substring(0, Math.min(8, entry.getKey().length()))); // Simplified name
                    userStats.put("email", entry.getKey() + "@example.com"); // Simplified email
                    return userStats;
                })
                .collect(Collectors.toList());
        
        // Calculate average notifications per user
        double averagePerUser = userNotificationCounts.size() > 0 ? 
                (double) totalNotifications / userNotificationCounts.size() : 0;
        
        // Build response
        Map<String, Object> analytics = new HashMap<>();
        analytics.put("totalNotifications", totalNotifications);
        analytics.put("readRate", readRate);
        analytics.put("averagePerUser", averagePerUser);
        analytics.put("notificationsByType", notificationsByType);
        analytics.put("mostActiveUsers", mostActiveUsers);
        analytics.put("timeRange", timeRange);
        analytics.put("generatedAt", LocalDateTime.now().toString());
        
        log.info("Notification analytics generated: {} notifications, {}% read rate", 
                totalNotifications, String.format("%.1f", readRate));
        
        return analytics;
    }
}