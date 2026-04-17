package com.sliit.uniops.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Getter;
import lombok.Setter;
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
@Getter
@Setter
@Document(collection = "notifications")
public class Notification {

    @Id
    private String id;

    private String userId;      // who receives this
    private String title;       // notification title
    private String message;      // notification message
    private NotificationType type;        // BOOKING_APPROVED, BOOKING_REJECTED, TICKET_ASSIGNED, etc.
    private String relatedEntityId;      // booking ID or ticket ID
    @Builder.Default
    private boolean isRead = false;     // default false
    private LocalDateTime createdAt;     // timestamp

    public enum NotificationType {
        BOOKING_APPROVED,
        BOOKING_REJECTED,
        TICKET_ASSIGNED,
        TICKET_STATUS_CHANGED,
        NEW_COMMENT,
        SYSTEM
    }

    // Manual getters/setters for isRead field
    public boolean getIsRead() {
        return isRead;
    }

    public void setIsRead(boolean isRead) {
        this.isRead = isRead;
    }
}
