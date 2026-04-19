package com.sliit.uniops.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;

/**
 * Service for sending email notifications.
 * Configured for SMTP email sending.
 */
@Service
@Slf4j
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    /**
     * Send ticket assignment notification to technician
     */
    public void sendTicketAssignmentNotification(String technicianEmail, String technicianName,
                                        String ticketId, String ticketTitle, String ticketDescription,
                                        String priority, String category, String location) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            
            helper.setFrom(fromEmail);
            helper.setTo(technicianEmail);
            helper.setSubject("New Ticket Assignment: " + ticketTitle);
            
            String emailContent = buildTicketAssignmentEmail(technicianName, ticketId, ticketTitle, 
                                                            ticketDescription, priority, category, location);
            helper.setText(emailContent, true);
            
            mailSender.send(message);
            log.info("Ticket assignment email sent to: {} for ticket: {}", technicianEmail, ticketId);
        } catch (MessagingException e) {
            log.error("Failed to send ticket assignment email to: {}", technicianEmail, e);
        }
    }

    /**
     * Send ticket status update notification to user
     */
    public void sendTicketStatusUpdateNotification(String userEmail, String userName,
                                            String ticketId, String ticketTitle, String newStatus,
                                            String updatedBy) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            
            helper.setFrom(fromEmail);
            helper.setTo(userEmail);
            helper.setSubject("Ticket Status Update: " + ticketTitle);
            
            String emailContent = buildTicketStatusUpdateEmail(userName, ticketId, ticketTitle, 
                                                             newStatus, updatedBy);
            helper.setText(emailContent, true);
            
            mailSender.send(message);
            log.info("Ticket status update email sent to: {} for ticket: {}", userEmail, ticketId);
        } catch (MessagingException e) {
            log.error("Failed to send ticket status update email to: {}", userEmail, e);
        }
    }

    /**
     * Send ticket resolution notification to user
     */
    public void sendTicketResolutionNotification(String userEmail, String userName,
                                          String ticketId, String ticketTitle, String resolutionNotes,
                                          String resolvedBy) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            
            helper.setFrom(fromEmail);
            helper.setTo(userEmail);
            helper.setSubject("Ticket Resolved: " + ticketTitle);
            
            String emailContent = buildTicketResolutionEmail(userName, ticketId, ticketTitle, 
                                                            resolutionNotes, resolvedBy);
            helper.setText(emailContent, true);
            
            mailSender.send(message);
            log.info("Ticket resolution email sent to: {} for ticket: {}", userEmail, ticketId);
        } catch (MessagingException e) {
            log.error("Failed to send ticket resolution email to: {}", userEmail, e);
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
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            
            helper.setFrom(fromEmail);
            helper.setTo(userEmail);
            helper.setSubject("Booking Status Update: " + resourceName);
            
            String emailContent = buildBookingStatusUpdateEmail(userName, bookingId, resourceName, 
                                                               bookingDate, startTime, endTime, 
                                                               newStatus, updatedBy, reason);
            helper.setText(emailContent, true);
            
            mailSender.send(message);
            log.info("Booking status update email sent to: {} for booking: {}", userEmail, bookingId);
        } catch (MessagingException e) {
            log.error("Failed to send booking status update email to: {}", userEmail, e);
        }
    }

    /**
     * Send email to booking management admin when new booking is created
     */
    public void sendBookingManagementNotification(String bookingId, String resourceName, 
                                                 String bookingDate, String startTime, String endTime, 
                                                 String requestedBy) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            
            helper.setFrom(fromEmail);
            helper.setTo("sachiniadmin@gmail.com");
            helper.setSubject("New Booking Request: " + resourceName);
            
            String emailContent = buildBookingManagementEmail(bookingId, resourceName, bookingDate, 
                                                             startTime, endTime, requestedBy);
            helper.setText(emailContent, true);
            
            mailSender.send(message);
            log.info("Booking management notification sent to sachiniadmin@gmail.com for booking: {}", bookingId);
        } catch (MessagingException e) {
            log.error("Failed to send booking management notification for booking: {}", bookingId, e);
        }
    }

    /**
     * Send email to ticket management admin when new ticket is created
     */
    public void sendTicketManagementNotification(String ticketId, String ticketTitle, 
                                               String ticketDescription, String priority, 
                                               String category, String submittedBy) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            
            helper.setFrom(fromEmail);
            helper.setTo("achiniadmin@gmail.com");
            helper.setSubject("New Ticket Created: " + ticketTitle);
            
            String emailContent = buildTicketManagementEmail(ticketId, ticketTitle, ticketDescription, 
                                                           priority, category, submittedBy);
            helper.setText(emailContent, true);
            
            mailSender.send(message);
            log.info("Ticket management notification sent to achiniadmin@gmail.com for ticket: {}", ticketId);
        } catch (MessagingException e) {
            log.error("Failed to send ticket management notification for ticket: {}", ticketId, e);
        }
    }

    private String buildTicketAssignmentEmail(String technicianName, String ticketId, String ticketTitle, 
                                            String ticketDescription, String priority, String category, String location) {
        return String.format(
            "<html><body>" +
            "<h2>New Ticket Assignment</h2>" +
            "<p>Dear %s,</p>" +
            "<p>You have been assigned a new ticket. Please review the details below:</p>" +
            "<table border='1' cellpadding='5' cellspacing='0' style='border-collapse: collapse;'>" +
            "<tr><td><strong>Ticket ID:</strong></td><td>%s</td></tr>" +
            "<tr><td><strong>Title:</strong></td><td>%s</td></tr>" +
            "<tr><td><strong>Description:</strong></td><td>%s</td></tr>" +
            "<tr><td><strong>Priority:</strong></td><td>%s</td></tr>" +
            "<tr><td><strong>Category:</strong></td><td>%s</td></tr>" +
            "<tr><td><strong>Location:</strong></td><td>%s</td></tr>" +
            "</table>" +
            "<p>Please log in to the system to view and manage this ticket.</p>" +
            "<p>Best regards,<br>UniOps Team</p>" +
            "</body></html>",
            technicianName, ticketId, ticketTitle, ticketDescription, priority, category, location
        );
    }

    private String buildTicketStatusUpdateEmail(String userName, String ticketId, String ticketTitle, 
                                               String newStatus, String updatedBy) {
        return String.format(
            "<html><body>" +
            "<h2>Ticket Status Update</h2>" +
            "<p>Dear %s,</p>" +
            "<p>Your ticket status has been updated. Please find the details below:</p>" +
            "<table border='1' cellpadding='5' cellspacing='0' style='border-collapse: collapse;'>" +
            "<tr><td><strong>Ticket ID:</strong></td><td>%s</td></tr>" +
            "<tr><td><strong>Title:</strong></td><td>%s</td></tr>" +
            "<tr><td><strong>New Status:</strong></td><td>%s</td></tr>" +
            "<tr><td><strong>Updated By:</strong></td><td>%s</td></tr>" +
            "</table>" +
            "<p>Please log in to the system to view more details.</p>" +
            "<p>Best regards,<br>UniOps Team</p>" +
            "</body></html>",
            userName, ticketId, ticketTitle, newStatus, updatedBy
        );
    }

    private String buildTicketResolutionEmail(String userName, String ticketId, String ticketTitle, 
                                            String resolutionNotes, String resolvedBy) {
        return String.format(
            "<html><body>" +
            "<h2>Ticket Resolved</h2>" +
            "<p>Dear %s,</p>" +
            "<p>Your ticket has been resolved. Please find the details below:</p>" +
            "<table border='1' cellpadding='5' cellspacing='0' style='border-collapse: collapse;'>" +
            "<tr><td><strong>Ticket ID:</strong></td><td>%s</td></tr>" +
            "<tr><td><strong>Title:</strong></td><td>%s</td></tr>" +
            "<tr><td><strong>Resolution Notes:</strong></td><td>%s</td></tr>" +
            "<tr><td><strong>Resolved By:</strong></td><td>%s</td></tr>" +
            "</table>" +
            "<p>Please log in to the system to confirm the resolution.</p>" +
            "<p>Best regards,<br>UniOps Team</p>" +
            "</body></html>",
            userName, ticketId, ticketTitle, resolutionNotes, resolvedBy
        );
    }

    private String buildBookingStatusUpdateEmail(String userName, String bookingId, String resourceName, 
                                                String bookingDate, String startTime, String endTime, 
                                                String newStatus, String updatedBy, String reason) {
        return String.format(
            "<html><body>" +
            "<h2>Booking Status Update</h2>" +
            "<p>Dear %s,</p>" +
            "<p>Your booking status has been updated. Please find the details below:</p>" +
            "<table border='1' cellpadding='5' cellspacing='0' style='border-collapse: collapse;'>" +
            "<tr><td><strong>Booking ID:</strong></td><td>%s</td></tr>" +
            "<tr><td><strong>Resource:</strong></td><td>%s</td></tr>" +
            "<tr><td><strong>Date:</strong></td><td>%s</td></tr>" +
            "<tr><td><strong>Time:</strong></td><td>%s - %s</td></tr>" +
            "<tr><td><strong>New Status:</strong></td><td>%s</td></tr>" +
            "<tr><td><strong>Updated By:</strong></td><td>%s</td></tr>" +
            (reason != null && !reason.trim().isEmpty() ? "<tr><td><strong>Reason:</strong></td><td>%s</td></tr>" : "") +
            "</table>" +
            "<p>Please log in to the system to view more details.</p>" +
            "<p>Best regards,<br>UniOps Team</p>" +
            "</body></html>",
            userName, bookingId, resourceName, bookingDate, startTime, endTime, newStatus, updatedBy, reason
        );
    }

    private String buildBookingManagementEmail(String bookingId, String resourceName, String bookingDate, 
                                              String startTime, String endTime, String requestedBy) {
        return String.format(
            "<html><body>" +
            "<h2>New Booking Request</h2>" +
            "<p>A new booking request has been submitted. Please review the details below:</p>" +
            "<table border='1' cellpadding='5' cellspacing='0' style='border-collapse: collapse;'>" +
            "<tr><td><strong>Booking ID:</strong></td><td>%s</td></tr>" +
            "<tr><td><strong>Resource:</strong></td><td>%s</td></tr>" +
            "<tr><td><strong>Date:</strong></td><td>%s</td></tr>" +
            "<tr><td><strong>Time:</strong></td><td>%s - %s</td></tr>" +
            "<tr><td><strong>Requested By:</strong></td><td>%s</td></tr>" +
            "</table>" +
            "<p>Please log in to the booking management system to approve or reject this request.</p>" +
            "<p>Best regards,<br>UniOps System</p>" +
            "</body></html>",
            bookingId, resourceName, bookingDate, startTime, endTime, requestedBy
        );
    }

    private String buildTicketManagementEmail(String ticketId, String ticketTitle, String ticketDescription, 
                                             String priority, String category, String submittedBy) {
        return String.format(
            "<html><body>" +
            "<h2>New Ticket Created</h2>" +
            "<p>A new ticket has been submitted. Please review the details below:</p>" +
            "<table border='1' cellpadding='5' cellspacing='0' style='border-collapse: collapse;'>" +
            "<tr><td><strong>Ticket ID:</strong></td><td>%s</td></tr>" +
            "<tr><td><strong>Title:</strong></td><td>%s</td></tr>" +
            "<tr><td><strong>Description:</strong></td><td>%s</td></tr>" +
            "<tr><td><strong>Priority:</strong></td><td>%s</td></tr>" +
            "<tr><td><strong>Category:</strong></td><td>%s</td></tr>" +
            "<tr><td><strong>Submitted By:</strong></td><td>%s</td></tr>" +
            "</table>" +
            "<p>Please log in to the ticket management system to assign and manage this ticket.</p>" +
            "<p>Best regards,<br>UniOps System</p>" +
            "</body></html>",
            ticketId, ticketTitle, ticketDescription, priority, category, submittedBy
        );
    }
}
