package com.sliit.uniops.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Service for sending email notifications.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    /**
     * Send ticket assignment notification to technician
     */
    public void sendTicketAssignmentNotification(String technicianEmail, String technicianName, 
                                        String ticketId, String ticketTitle, String ticketDescription, 
                                        String priority, String category, String location) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(technicianEmail);
            message.setSubject("New Ticket Assignment - " + ticketId);
            
            String emailBody = buildTicketAssignmentEmail(technicianName, ticketId, ticketTitle, 
                                                     ticketDescription, priority, category, location);
            message.setText(emailBody);
            
            mailSender.send(message);
            log.info("Ticket assignment email sent to technician: {} for ticket: {}", technicianEmail, ticketId);
        } catch (Exception e) {
            log.error("Failed to send ticket assignment email to: {} for ticket: {}", technicianEmail, ticketId, e);
        }
    }

    /**
     * Send ticket status update notification to user
     */
    public void sendTicketStatusUpdateNotification(String userEmail, String userName, 
                                            String ticketId, String ticketTitle, String newStatus, 
                                            String updatedBy) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(userEmail);
            message.setSubject("Ticket Status Update - " + ticketId);
            
            String emailBody = buildStatusUpdateEmail(userName, ticketId, ticketTitle, newStatus, updatedBy);
            message.setText(emailBody);
            
            mailSender.send(message);
            log.info("Ticket status update email sent to user: {} for ticket: {}", userEmail, ticketId);
        } catch (Exception e) {
            log.error("Failed to send ticket status update email to: {} for ticket: {}", userEmail, ticketId, e);
        }
    }

    /**
     * Send ticket resolution notification to user
     */
    public void sendTicketResolutionNotification(String userEmail, String userName, 
                                          String ticketId, String ticketTitle, String resolutionNotes, 
                                          String resolvedBy) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(userEmail);
            message.setSubject("Ticket Resolved - " + ticketId);
            
            String emailBody = buildResolutionEmail(userName, ticketId, ticketTitle, resolutionNotes, resolvedBy);
            message.setText(emailBody);
            
            mailSender.send(message);
            log.info("Ticket resolution email sent to user: {} for ticket: {}", userEmail, ticketId);
        } catch (Exception e) {
            log.error("Failed to send ticket resolution email to: {} for ticket: {}", userEmail, ticketId, e);
        }
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
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(userEmail);
            message.setSubject("Booking Status Update - " + bookingId);

            String emailBody = buildBookingStatusUpdateEmail(
                    userName,
                    bookingId,
                    resourceName,
                    bookingDate,
                    startTime,
                    endTime,
                    newStatus,
                    updatedBy,
                    reason
            );
            message.setText(emailBody);

            mailSender.send(message);
            log.info("Booking status update email sent to user: {} for booking: {}", userEmail, bookingId);
        } catch (Exception e) {
            log.error("Failed to send booking status update email to: {} for booking: {}", userEmail, bookingId, e);
        }
    }

    private String buildTicketAssignmentEmail(String technicianName, String ticketId, String ticketTitle, 
                                       String ticketDescription, String priority, String category, String location) {
        return String.format(
            "Dear %s,\n\n" +
            "You have been assigned a new ticket:\n\n" +
            "Ticket ID: %s\n" +
            "Title: %s\n" +
            "Description: %s\n" +
            "Priority: %s\n" +
            "Category: %s\n" +
            "Location: %s\n\n" +
            "Please log in to the system to view and take action on this ticket.\n\n" +
            "Best regards,\n" +
            "UniOps Support Team",
            technicianName, ticketId, ticketTitle, ticketDescription, priority, category, location
        );
    }

    private String buildStatusUpdateEmail(String userName, String ticketId, String ticketTitle, 
                                     String newStatus, String updatedBy) {
        return String.format(
            "Dear %s,\n\n" +
            "Your ticket status has been updated:\n\n" +
            "Ticket ID: %s\n" +
            "Title: %s\n" +
            "New Status: %s\n" +
            "Updated By: %s\n\n" +
            "Please log in to the system to view the updated ticket details.\n\n" +
            "Best regards,\n" +
            "UniOps Support Team",
            userName, ticketId, ticketTitle, newStatus, updatedBy
        );
    }

    private String buildResolutionEmail(String userName, String ticketId, String ticketTitle, 
                                  String resolutionNotes, String resolvedBy) {
        return String.format(
            "Dear %s,\n\n" +
            "Your ticket has been resolved:\n\n" +
            "Ticket ID: %s\n" +
            "Title: %s\n" +
            "Resolved By: %s\n" +
            "Resolution Notes: %s\n\n" +
            "Please log in to the system to review the resolution and provide feedback if needed.\n\n" +
            "Best regards,\n" +
            "UniOps Support Team",
            userName, ticketId, ticketTitle, resolvedBy, resolutionNotes
        );
    }

    private String buildBookingStatusUpdateEmail(
            String userName,
            String bookingId,
            String resourceName,
            String bookingDate,
            String startTime,
            String endTime,
            String newStatus,
            String updatedBy,
            String reason) {
        String reasonSection = (reason == null || reason.isBlank())
                ? ""
                : String.format("Reason: %s%n", reason);

        return String.format(
            "Dear %s,%n%n" +
            "Your booking status has been updated.%n%n" +
            "Booking ID: %s%n" +
            "Resource: %s%n" +
            "Date: %s%n" +
            "Time: %s - %s%n" +
            "New Status: %s%n" +
            "Updated By: %s%n" +
            "%s%n" +
            "Please log in to the system to view the latest booking details.%n%n" +
            "Best regards,%n" +
            "UniOps Support Team",
            userName,
            bookingId,
            resourceName,
            bookingDate,
            startTime,
            endTime,
            newStatus,
            updatedBy,
            reasonSection
        );
    }
}
