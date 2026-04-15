package com.sliit.uniops.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for Non-Academic Staff Dashboard data.
 * Currently uses mock data for all metrics until models are fully implemented.
 */
@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class StaffDashboardController {

    /**
     * Get stats for the staff dashboard.
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("equipmentItems", 156);
        stats.put("activeBookings", 23);
        stats.put("pendingRequests", 8);
        stats.put("maintenanceTickets", 5);
        
        return ResponseEntity.ok(stats);
    }
}
