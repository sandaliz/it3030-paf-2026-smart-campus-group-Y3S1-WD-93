package com.sliit.uniops.service.ticket;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.sliit.uniops.model.ticket.TicketModel;
import com.sliit.uniops.model.ticket.CommentModel;
import com.sliit.uniops.model.ticket.NotificationModel;
import com.sliit.uniops.model.User;
import com.sliit.uniops.repository.ticket.TicketNotificationRepository;
import com.sliit.uniops.service.EmailService;

@Service("ticketNotificationService")
@RequiredArgsConstructor
@Slf4j
public class TicketNotificationService {

    private final TicketNotificationRepository notificationRepository;
    private final EmailService emailService;

    // ✅ Ticket Created
    public void notifyTicketCreated(TicketModel ticket, String userName) {

        String message = String.format(
                "Ticket #%s created by %s | Title: %s | Priority: %s | Status: %s",
                ticket.getId(), userName, ticket.getTitle(),
                ticket.getPriority(), ticket.getStatus());

        storeNotification(ticket.getCreatedBy(), "TICKET_CREATED", message, ticket.getId());
    }

    // ✅ Status Changed
    public void notifyTicketStatusChanged(TicketModel ticket, String oldStatus, String newStatus, String userId) {

        String message = String.format(
                "Ticket #%s status changed from %s to %s | Title: %s",
                ticket.getId(), oldStatus, newStatus, ticket.getTitle());

        storeNotification(ticket.getCreatedBy(), "STATUS_CHANGED", message, ticket.getId());

        if (ticket.getAssignedTo() != null) {
            storeNotification(ticket.getAssignedTo(), "STATUS_CHANGED", message, ticket.getId());
        }
    }

    // ✅ Assigned
    public void notifyTicketAssigned(TicketModel ticket, User technician, String assignedBy) {

        String message = String.format(
                "Ticket #%s assigned to %s by %s | Title: %s | Priority: %s",
                ticket.getId(), technician.getName(), assignedBy,
                ticket.getTitle(), ticket.getPriority());

        if (ticket.getAssignedTo() != null) {
            storeNotification(ticket.getAssignedTo(), "TICKET_ASSIGNED", message, ticket.getId());
            
            // Send email notification to technician
            try {
                emailService.sendTicketAssignmentNotification(
                    technician.getEmail(),            // technician email
                    technician.getName(),            // technician name
                    ticket.getId(),                   // ticket ID
                    ticket.getTitle(),                 // ticket title
                    ticket.getDescription(),            // ticket description
                    ticket.getPriority().toString(),  // priority
                    ticket.getCategory().toString(),  // category
                    ticket.getLocation()               // location
                );
                log.info("Email notification sent to technician: {} for ticket: {}", technician.getEmail(), ticket.getId());
            } catch (Exception e) {
                log.error("Failed to send email notification to technician: {} for ticket: {}", 
                           technician.getEmail(), ticket.getId(), e);
            }
        }

        storeNotification(ticket.getCreatedBy(), "TICKET_ASSIGNED", message, ticket.getId());
    }

    // ✅ New Comment
    public void notifyNewComment(TicketModel ticket, CommentModel comment, String authorName) {

        String message = String.format(
                "New comment on Ticket #%s by %s: %s",
                ticket.getId(), authorName, comment.getContent());

        if (!ticket.getCreatedBy().equals(comment.getAuthorId())) {
            storeNotification(ticket.getCreatedBy(), "NEW_COMMENT", message, ticket.getId());
        }

        if (ticket.getAssignedTo() != null &&
                !ticket.getAssignedTo().equals(comment.getAuthorId())) {

            storeNotification(ticket.getAssignedTo(), "NEW_COMMENT", message, ticket.getId());
        }
    }

    // ✅ STORE NOTIFICATION 
    public void storeNotification(String userId, String type, String message, String ticketId) {

        NotificationModel notification = new NotificationModel();

        notification.setUserId(userId);
        notification.setType(type);
        notification.setMessage(message);
        notification.setTicketId(ticketId);
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());

        notificationRepository.save(notification);
    }

    // ✅ Get user notifications
    public List<NotificationModel> getUserNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    // ✅ Mark as read
    public void markNotificationAsRead(String notificationId) {

        NotificationModel notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    // ✅ Unread count
    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    // ✅ Mark all as read for user
    public void markAllAsRead(String userId) {
        List<NotificationModel> unreadNotifications = 
            notificationRepository.findByUserIdAndIsReadFalse(userId);
        
        unreadNotifications.forEach(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }

    // ✅ User confirmed ticket resolution
    public void notifyTicketConfirmedByUser(TicketModel ticket, String userId, String feedback) {
        log.info("Notifying ticket confirmed by user: {}", ticket.getId());
        
        // Notify admin
        NotificationModel adminNotification = new NotificationModel();
        adminNotification.setUserId("admin");
        adminNotification.setTitle("Ticket Resolution Confirmed by User");
        adminNotification.setMessage(String.format(
            "User has confirmed resolution for ticket '%s'. Feedback: %s", 
            ticket.getTitle(), 
            feedback != null ? feedback : "No feedback provided"
        ));
        adminNotification.setType("TICKET_CONFIRMED");
        adminNotification.setTicketId(ticket.getId());
        adminNotification.setRead(false);
        adminNotification.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(adminNotification);

        // Notify assigned technician
        if (ticket.getAssignedTo() != null && !ticket.getAssignedTo().isEmpty()) {
            NotificationModel technicianNotification = new NotificationModel();
            technicianNotification.setUserId(ticket.getAssignedTo());
            technicianNotification.setTitle("Ticket Resolution Confirmed by User");
            technicianNotification.setMessage(String.format(
                "User has confirmed resolution for your assigned ticket '%s'. Feedback: %s", 
                ticket.getTitle(), 
                feedback != null ? feedback : "No feedback provided"
            ));
            technicianNotification.setType("TICKET_CONFIRMED");
            technicianNotification.setTicketId(ticket.getId());
            technicianNotification.setRead(false);
            technicianNotification.setCreatedAt(LocalDateTime.now());
            notificationRepository.save(technicianNotification);
        }
    }
}
