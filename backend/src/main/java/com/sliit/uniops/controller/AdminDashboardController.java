package com.sliit.uniops.controller;

import com.sliit.uniops.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for Admin Dashboard data.
 * Currently uses mock data for Bookings and Tickets while using live data for Users.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final UserRepository userRepository;

    /**
     * Get system-wide stats for the dashboard.
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        long userCount = userRepository.count();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userCount);
        stats.put("totalBookings", 1234); // Mock
        stats.put("totalTickets", 89);    // Mock
        stats.put("pendingBookings", 12); // Mock
        stats.put("openTickets", 8);      // Mock
        
        return ResponseEntity.ok(stats);
    }
}
