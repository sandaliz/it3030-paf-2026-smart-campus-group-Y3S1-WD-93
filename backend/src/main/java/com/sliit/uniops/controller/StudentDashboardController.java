package com.sliit.uniops.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for Student Dashboard data.
 * Currently uses mock data for all metrics until models are fully implemented.
 */
@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
public class StudentDashboardController {

    /**
     * Get stats for the student dashboard.
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("activeBookings", 3);
        stats.put("pendingBookings", 2);
        stats.put("approvedTickets", 1);
        stats.put("openTickets", 2);
        
        return ResponseEntity.ok(stats);
    }
}
