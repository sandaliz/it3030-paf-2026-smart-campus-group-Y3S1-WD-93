package com.sliit.uniops.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;

/**
 * Document for storing user notification preferences
 */
@Document(collection = "notification_preferences")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreference {

    @Id
    private String id;

    @Field(name = "user_id")
    private String userId;

    // Booking Updates Preferences
    @Field(name = "booking_approved_email")
    @Builder.Default
    private Boolean bookingApprovedEmail = true;

    @Field(name = "booking_approved_bell")
    @Builder.Default
    private Boolean bookingApprovedBell = true;

    @Field(name = "booking_rejected_email")
    @Builder.Default
    private Boolean bookingRejectedEmail = true;

    @Field(name = "booking_rejected_bell")
    @Builder.Default
    private Boolean bookingRejectedBell = true;

    @Field(name = "booking_cancelled_email")
    @Builder.Default
    private Boolean bookingCancelledEmail = true;

    @Field(name = "booking_cancelled_bell")
    @Builder.Default
    private Boolean bookingCancelledBell = true;

    // Ticket Updates Preferences
    @Field(name = "ticket_assigned_email")
    @Builder.Default
    private Boolean ticketAssignedEmail = true;

    @Field(name = "ticket_assigned_bell")
    @Builder.Default
    private Boolean ticketAssignedBell = true;

    @Field(name = "ticket_status_changed_email")
    @Builder.Default
    private Boolean ticketStatusChangedEmail = true;

    @Field(name = "ticket_status_changed_bell")
    @Builder.Default
    private Boolean ticketStatusChangedBell = true;

    @Field(name = "ticket_comment_added_email")
    @Builder.Default
    private Boolean ticketCommentAddedEmail = true;

    @Field(name = "ticket_comment_added_bell")
    @Builder.Default
    private Boolean ticketCommentAddedBell = false;

    // System Notifications
    @Field(name = "system_maintenance_email")
    @Builder.Default
    private Boolean systemMaintenanceEmail = false;

    @Field(name = "system_maintenance_bell")
    @Builder.Default
    private Boolean systemMaintenanceBell = true;

    @Field(name = "created_at")
    private LocalDateTime createdAt;

    @Field(name = "updated_at")
    private LocalDateTime updatedAt;
}
