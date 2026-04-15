package com.sliit.uniops.service.ticket;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.sliit.uniops.model.ticket.TicketModel;
import com.sliit.uniops.model.ticket.CommentModel;
import com.sliit.uniops.model.ticket.NotificationModel;
import com.sliit.uniops.repository.ticket.TicketNotificationRepository;

@Service("ticketNotificationService")
@RequiredArgsConstructor
@Slf4j
public class TicketNotificationService {

    private final TicketNotificationRepository notificationRepository;

    // ✅ Ticket Created
    public void notifyTicketCreated(TicketModel ticket, String userName) {

        String message = String.format(
                "Ticket #%s created by %s | Title: %s | Priority: %s | Status: %s",
                ticket.getId(), userName, ticket.getTitle(),
                ticket.getPriority(), ticket.getStatus());

        storeNotification(ticket.getCreatedBy(), "TICKET_CREATED", message, ticket.getId());
    }

    // ✅ Status Changed
    public void notifyTicketStatusChanged(TicketModel ticket, String oldStatus, String newStatus) {

        String message = String.format(
                "Ticket #%s status changed from %s to %s | Title: %s",
                ticket.getId(), oldStatus, newStatus, ticket.getTitle());

        storeNotification(ticket.getCreatedBy(), "STATUS_CHANGED", message, ticket.getId());

        if (ticket.getAssignedTo() != null) {
            storeNotification(ticket.getAssignedTo(), "STATUS_CHANGED", message, ticket.getId());
        }
    }

    // ✅ Assigned
    public void notifyTicketAssigned(TicketModel ticket, String technicianName, String assignedBy) {

        String message = String.format(
                "Ticket #%s assigned to %s by %s | Title: %s | Priority: %s",
                ticket.getId(), technicianName, assignedBy,
                ticket.getTitle(), ticket.getPriority());

        if (ticket.getAssignedTo() != null) {
            storeNotification(ticket.getAssignedTo(), "TICKET_ASSIGNED", message, ticket.getId());
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
    private void storeNotification(String userId, String type, String message, String ticketId) {

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
}