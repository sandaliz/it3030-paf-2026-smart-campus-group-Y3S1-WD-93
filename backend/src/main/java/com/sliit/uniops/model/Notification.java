package com.sliit.uniops.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Represents a notification sent to a user.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
public class Notification {

    @Id
    private String id;

    private String userId;      // The target user's email or ID
    private String message;
    private String type;        // BOOKING, TICKET, COMMENT, etc.
    private String status;      // UNREAD, READ
    
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    private String referenceId; // ID of the related object (e.g., bookingId)
}
