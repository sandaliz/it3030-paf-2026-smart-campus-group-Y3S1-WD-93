package com.sliit.uniops.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for Lecturer Dashboard data.
 * Currently uses mock data for all metrics until models are fully implemented.
 */
@RestController
@RequestMapping("/api/lecturer")
@RequiredArgsConstructor
public class LecturerDashboardController {

    /**
     * Get stats for the lecturer dashboard.
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("upcomingLectures", 6);
        stats.put("totalBookings", 24);
        stats.put("pendingApprovals", 3);
        stats.put("openTickets", 2);
        
        return ResponseEntity.ok(stats);
    }
}
