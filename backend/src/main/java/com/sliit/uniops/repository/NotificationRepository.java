package com.sliit.uniops.repository;

import com.sliit.uniops.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository interface for Notification documents.
 */
@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {

    /**
     * Get all notifications for a user, ordered by creation date (newest first)
     */
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);

    /**
     * Get only unread notifications for a user
     */
    List<Notification> findByUserIdAndIsReadFalse(String userId);

    /**
     * Count unread notifications for a user (for badge display)
     */
    long countByUserIdAndIsReadFalse(String userId);

    /**
     * Delete a notification (user can only delete their own)
     */
    void deleteByIdAndUserId(String id, String userId);

    /**
     * Find a specific notification by ID and user ID
     */
    Notification findByIdAndUserId(String id, String userId);

    /**
     * Find notifications by user ID and related entity ID (for migration)
     */
    List<Notification> findByUserIdAndRelatedEntityId(String userId, String relatedEntityId);

    /**
     * Find notifications within date range for analytics
     */
    List<Notification> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
}
