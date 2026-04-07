package com.sliit.uniops.repository;

import com.sliit.uniops.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

/**
 * Repository interface for Notification documents.
 */
public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);
    long countByUserIdAndStatus(String userId, String status);
}
