package com.sliit.uniops.controller;

import com.sliit.uniops.service.NotificationMigrationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for notification migration operations
 */
@RestController
@RequestMapping("/api/admin/notifications/migration")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class NotificationMigrationController {

    private final NotificationMigrationService migrationService;

    /**
     * Generate notifications for all existing tickets
     * Only accessible by admins
     */
    @PostMapping("/migrate-all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> migrateAllTickets() {
        try {
            log.info("Admin requested migration of all existing tickets to notifications");
            migrationService.generateNotificationsForExistingTickets();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Migration completed successfully");
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error during migration", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Migration failed: " + e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Generate notification for a specific ticket
     * Only accessible by admins
     */
    @PostMapping("/migrate/{ticketId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> migrateTicket(@PathVariable String ticketId) {
        try {
            log.info("Admin requested migration for ticket: {}", ticketId);
            migrationService.generateNotificationForTicket(ticketId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Notification created for ticket: " + ticketId);
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error during migration for ticket: {}", ticketId, e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Migration failed: " + e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
