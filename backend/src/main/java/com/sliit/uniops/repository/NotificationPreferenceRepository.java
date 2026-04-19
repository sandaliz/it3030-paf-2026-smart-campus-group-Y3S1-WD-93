package com.sliit.uniops.repository;

import com.sliit.uniops.model.NotificationPreference;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for NotificationPreference documents
 */
@Repository
public interface NotificationPreferenceRepository extends MongoRepository<NotificationPreference, String> {
    
    /**
     * Find notification preferences by user ID
     */
    Optional<NotificationPreference> findByUserId(String userId);
    
    /**
     * Check if preferences exist for a user
     */
    boolean existsByUserId(String userId);
}
