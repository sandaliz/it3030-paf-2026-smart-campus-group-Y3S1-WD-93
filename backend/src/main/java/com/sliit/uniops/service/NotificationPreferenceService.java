package com.sliit.uniops.service;

import com.sliit.uniops.model.NotificationPreference;
import com.sliit.uniops.repository.NotificationPreferenceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Service for managing user notification preferences
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationPreferenceService {

    private final NotificationPreferenceRepository preferenceRepository;

    /**
     * Get user notification preferences, create default if not exists
     */
    public NotificationPreference getUserPreferences(String userId) {
        log.debug("Fetching notification preferences for user: {}", userId);
        
        return preferenceRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultPreferences(userId));
    }

    /**
     * Create default notification preferences for a new user
     */
    public NotificationPreference createDefaultPreferences(String userId) {
        log.info("Creating default notification preferences for user: {}", userId);
        
        NotificationPreference defaultPreferences = NotificationPreference.builder()
                .userId(userId)
                .bookingApprovedEmail(true)
                .bookingApprovedBell(true)
                .bookingRejectedEmail(true)
                .bookingRejectedBell(true)
                .bookingCancelledEmail(true)
                .bookingCancelledBell(true)
                .ticketAssignedEmail(true)
                .ticketAssignedBell(true)
                .ticketStatusChangedEmail(true)
                .ticketStatusChangedBell(true)
                .ticketCommentAddedEmail(true)
                .ticketCommentAddedBell(false)
                .systemMaintenanceEmail(false)
                .systemMaintenanceBell(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return preferenceRepository.save(defaultPreferences);
    }

    /**
     * Update user notification preferences
     */
    public NotificationPreference updatePreferences(String userId, NotificationPreference preferences) {
        log.info("Updating notification preferences for user: {}", userId);
        
        NotificationPreference existing = getUserPreferences(userId);
        
        // Update all preference fields
        existing.setBookingApprovedEmail(preferences.getBookingApprovedEmail());
        existing.setBookingApprovedBell(preferences.getBookingApprovedBell());
        existing.setBookingRejectedEmail(preferences.getBookingRejectedEmail());
        existing.setBookingRejectedBell(preferences.getBookingRejectedBell());
        existing.setBookingCancelledEmail(preferences.getBookingCancelledEmail());
        existing.setBookingCancelledBell(preferences.getBookingCancelledBell());
        existing.setTicketAssignedEmail(preferences.getTicketAssignedEmail());
        existing.setTicketAssignedBell(preferences.getTicketAssignedBell());
        existing.setTicketStatusChangedEmail(preferences.getTicketStatusChangedEmail());
        existing.setTicketStatusChangedBell(preferences.getTicketStatusChangedBell());
        existing.setTicketCommentAddedEmail(preferences.getTicketCommentAddedEmail());
        existing.setTicketCommentAddedBell(preferences.getTicketCommentAddedBell());
        existing.setSystemMaintenanceEmail(preferences.getSystemMaintenanceEmail());
        existing.setSystemMaintenanceBell(preferences.getSystemMaintenanceBell());
        existing.setUpdatedAt(LocalDateTime.now());

        return preferenceRepository.save(existing);
    }

    /**
     * Check if user should receive email notification for specific type
     */
    public boolean shouldSendEmailNotification(String userId, String notificationType) {
        NotificationPreference preferences = getUserPreferences(userId);
        
        return switch (notificationType) {
            case "BOOKING_APPROVED" -> preferences.getBookingApprovedEmail();
            case "BOOKING_REJECTED" -> preferences.getBookingRejectedEmail();
            case "BOOKING_CANCELLED" -> preferences.getBookingCancelledEmail();
            case "TICKET_ASSIGNED" -> preferences.getTicketAssignedEmail();
            case "TICKET_STATUS_CHANGED" -> preferences.getTicketStatusChangedEmail();
            case "NEW_COMMENT" -> preferences.getTicketCommentAddedEmail();
            case "SYSTEM_MAINTENANCE" -> preferences.getSystemMaintenanceEmail();
            default -> true; // Default to true for unknown types
        };
    }

    /**
     * Check if user should receive bell notification for specific type
     */
    public boolean shouldSendBellNotification(String userId, String notificationType) {
        NotificationPreference preferences = getUserPreferences(userId);
        
        return switch (notificationType) {
            case "BOOKING_APPROVED" -> preferences.getBookingApprovedBell();
            case "BOOKING_REJECTED" -> preferences.getBookingRejectedBell();
            case "BOOKING_CANCELLED" -> preferences.getBookingCancelledBell();
            case "TICKET_ASSIGNED" -> preferences.getTicketAssignedBell();
            case "TICKET_STATUS_CHANGED" -> preferences.getTicketStatusChangedBell();
            case "NEW_COMMENT" -> preferences.getTicketCommentAddedBell();
            case "SYSTEM_MAINTENANCE" -> preferences.getSystemMaintenanceBell();
            default -> true; // Default to true for unknown types
        };
    }
}
