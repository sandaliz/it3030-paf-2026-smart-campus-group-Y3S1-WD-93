package com.sliit.uniops.service;

import com.sliit.uniops.model.Notification;
import com.sliit.uniops.model.ticket.TicketModel;
import com.sliit.uniops.repository.NotificationRepository;
import com.sliit.uniops.repository.ticket.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service to migrate existing tickets to notifications
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationMigrationService {

    private final NotificationRepository notificationRepository;
    private final TicketRepository ticketRepository;
    private final NotificationService notificationService;

    /**
     * Generate notifications for all existing tickets that don't have notifications yet
     */
    public void generateNotificationsForExistingTickets() {
        log.info("Starting migration for existing tickets to notifications");
        
        List<TicketModel> existingTickets = ticketRepository.findAll();
        int notificationsCreated = 0;
        
        for (TicketModel ticket : existingTickets) {
            // Check if notification already exists for this ticket
            List<Notification> existingNotifications = notificationRepository
                .findByUserIdAndRelatedEntityId(ticket.getCreatedBy(), ticket.getId());
            
            if (existingNotifications.isEmpty()) {
                // Create notification for existing ticket
                createNotificationForExistingTicket(ticket);
                notificationsCreated++;
            }
        }
        
        log.info("Migration completed. Created {} notifications for existing tickets", notificationsCreated);
    }

    /**
     * Create a notification for an existing ticket
     */
    private void createNotificationForExistingTicket(TicketModel ticket) {
        String title = "Existing Ticket: " + ticket.getTitle();
        String message = String.format("You have an existing ticket: %s - Status: %s", 
            ticket.getTitle(), ticket.getStatus());
        
        // Mark as read since it's an existing item
        Notification notification = notificationService.createNotification(
            ticket.getCreatedBy(),
            title,
            message,
            Notification.NotificationType.TICKET_STATUS_CHANGED,
            ticket.getId()
        );
        
        // Immediately mark as read for existing tickets
        notification.setIsRead(true);
        notificationRepository.save(notification);
        
        log.info("Created notification for existing ticket: {}", ticket.getId());
    }

    /**
     * Generate notifications for a specific ticket
     */
    public void generateNotificationForTicket(String ticketId) {
        TicketModel ticket = ticketRepository.findById(ticketId).orElse(null);
        if (ticket != null) {
            createNotificationForExistingTicket(ticket);
            log.info("Generated notification for ticket: {}", ticketId);
        } else {
            log.warn("Ticket not found: {}", ticketId);
        }
    }
}
