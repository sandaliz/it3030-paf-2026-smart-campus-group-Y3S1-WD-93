package com.sliit.uniops.service;

// Email service temporarily disabled due to mail dependency resolution issues
// TODO: Configure SMTP settings and enable email notifications when needed

import org.springframework.stereotype.Service;

/**
 * Service for sending email notifications.
 * Currently disabled - requires SMTP configuration.
 */
@Service
public class EmailService {

    /**
     * Send ticket assignment notification to technician
     */
    public void sendTicketAssignmentNotification(String technicianEmail, String technicianName,
                                        String ticketId, String ticketTitle, String ticketDescription,
                                        String priority, String category, String location) {
        // Email functionality disabled
    }

    /**
     * Send ticket status update notification to user
     */
    public void sendTicketStatusUpdateNotification(String userEmail, String userName,
                                            String ticketId, String ticketTitle, String newStatus,
                                            String updatedBy) {
        // Email functionality disabled
    }

    /**
     * Send ticket resolution notification to user
     */
    public void sendTicketResolutionNotification(String userEmail, String userName,
                                          String ticketId, String ticketTitle, String resolutionNotes,
                                          String resolvedBy) {
        // Email functionality disabled
    }

    /**
     * Send booking status update notification to the requester.
     */
    public void sendBookingStatusUpdateNotification(
            String userEmail,
            String userName,
            String bookingId,
            String resourceName,
            String bookingDate,
            String startTime,
            String endTime,
            String newStatus,
            String updatedBy,
            String reason) {
        // Email functionality disabled
    }
}
