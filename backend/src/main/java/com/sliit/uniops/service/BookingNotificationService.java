package com.sliit.uniops.service;

import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
public class BookingNotificationService {
    
    public void sendNotification(String userId, String type, String message, String referenceId) {
        // TEMPORARY - Just log to console
        System.out.println("=========================================");
        System.out.println("NOTIFICATION SENT:");
        System.out.println("User ID: " + userId);
        System.out.println("Type: " + type);
        System.out.println("Message: " + message);
        System.out.println("Reference ID: " + referenceId);
        System.out.println("Timestamp: " + LocalDateTime.now());
        System.out.println("=========================================");
        
        
    }
}
