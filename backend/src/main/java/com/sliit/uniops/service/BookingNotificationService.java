package com.sliit.uniops.service;

import com.sliit.uniops.model.Notification;
import com.sliit.uniops.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service for sending booking-related notifications.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BookingNotificationService {

    private final NotificationService notificationService;

    /**
     * Send booking approval notification
     */
    public void sendBookingApprovedNotification(String userId, String bookingId, String resourceName) {
        String title = "Booking Approved";
        String message = String.format("Your booking for %s is confirmed", resourceName);
        
        notificationService.createNotification(userId, title, message, Notification.NotificationType.BOOKING_APPROVED, bookingId);
        log.info("Booking approval notification sent to user: {} for booking: {}", userId, bookingId);
    }

    /**
     * Send booking rejection notification
     */
    public void sendBookingRejectedNotification(String userId, String bookingId, String resourceName, String reason) {
        String title = "Booking Rejected";
        String message = String.format("Your booking for %s was rejected. Reason: %s", resourceName, reason);
        
        notificationService.createNotification(userId, title, message, Notification.NotificationType.BOOKING_REJECTED, bookingId);
        log.info("Booking rejection notification sent to user: {} for booking: {}", userId, bookingId);
    }

    /**
     * Send booking status change notification
     */
    public void sendBookingStatusNotification(String userId, String bookingId, String resourceName, String status) {
        String title = "Booking Status Changed";
        String message = String.format("Your booking status for %s has been changed to: %s", resourceName, status);
        
        notificationService.createNotification(userId, title, message, Notification.NotificationType.SYSTEM, bookingId);
        log.info("Booking status notification sent to user: {} for booking: {}", userId, bookingId);
    }
}
