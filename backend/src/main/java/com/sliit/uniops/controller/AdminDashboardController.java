package com.sliit.uniops.controller;

import com.sliit.uniops.model.Booking;
import com.sliit.uniops.model.User;
import com.sliit.uniops.service.BookingService;
import com.sliit.uniops.service.ResourceService;
import com.sliit.uniops.service.ticket.TicketService;
import com.sliit.uniops.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Controller for admin dashboard statistics and overview data
 */
@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AdminDashboardController {

    private final UserRepository userRepository;
    private final BookingService bookingService;
    private final TicketService ticketService;
    private final ResourceService resourceService;

    /**
     * Simple test endpoint
     */
    @GetMapping("/test")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> testEndpoint() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Admin dashboard endpoint is working!");
        response.put("timestamp", java.time.LocalDateTime.now().toString());
        return ResponseEntity.ok(response);
    }

    /**
     * Get dashboard statistics
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        try {
            Map<String, Object> stats = new HashMap<>();
            
            // User statistics
            long totalUsers = userRepository.count();
            stats.put("totalUsers", totalUsers);
            
            // Booking statistics
            List<Booking> allBookings = bookingService.getAllBookings(null, null);
            long totalBookings = allBookings.size();
            long pendingBookings = allBookings.stream()
                    .filter(booking -> "PENDING".equals(booking.getStatus()))
                    .count();
            stats.put("totalBookings", totalBookings);
            stats.put("pendingBookings", pendingBookings);
            
            // Ticket statistics
            var allTicketsPage = ticketService.getAllTickets(org.springframework.data.domain.PageRequest.of(0, 1000));
            long totalTickets = allTicketsPage.getTotalElements();
            long openTickets = allTicketsPage.getContent().stream()
                    .filter(ticket -> {
                        try {
                            Object status = ticket.getClass().getMethod("getStatus").invoke(ticket);
                            return "OPEN".equals(status.toString());
                        } catch (Exception e) {
                            return false;
                        }
                    })
                    .count();
            stats.put("totalTickets", totalTickets);
            stats.put("openTickets", openTickets);
            
            // Resource statistics
            long totalResources = resourceService.getAllResources().size();
            stats.put("totalResources", totalResources);
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to fetch dashboard stats: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Get pending bookings for approval/rejection
     */
    @GetMapping("/pending-bookings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getPendingBookings() {
        try {
            List<Booking> pendingBookings = bookingService.getAllBookings("PENDING", null).stream()
                    .filter(booking -> "PENDING".equals(booking.getStatus()))
                    .collect(Collectors.toList());
            
            List<Map<String, Object>> result = pendingBookings.stream()
                    .map(booking -> {
                        Map<String, Object> bookingData = new HashMap<>();
                        bookingData.put("id", booking.getId());
                        // Need to fetch related entities properly
                        // bookingData.put("resource", booking.getResource().getName());
                        // bookingData.put("user", booking.getUser().getName());
                        // bookingData.put("userRole", booking.getUser().getRoles().iterator().next().name());
                        bookingData.put("resource", "Resource Name"); // Placeholder
                        bookingData.put("user", "User Name"); // Placeholder
                        bookingData.put("userRole", "USER"); // Placeholder
                        bookingData.put("startTime", booking.getStartTime());
                        bookingData.put("endTime", booking.getEndTime());
                        bookingData.put("purpose", booking.getPurpose());
                        return bookingData;
                    })
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(List.of(Map.of("error", "Failed to fetch pending bookings: " + e.getMessage())));
        }
    }

    /**
     * Get open tickets for assignment
     */
    @GetMapping("/open-tickets")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getOpenTickets() {
        try {
            var allTicketsPage = ticketService.getAllTickets(org.springframework.data.domain.PageRequest.of(0, 1000));
            
            List<Map<String, Object>> openTickets = allTicketsPage.getContent().stream()
                    .filter(ticket -> {
                        try {
                            Object status = ticket.getClass().getMethod("getStatus").invoke(ticket);
                            return "OPEN".equals(status.toString());
                        } catch (Exception e) {
                            return false;
                        }
                    })
                    .map(ticket -> {
                        try {
                            Map<String, Object> ticketData = new HashMap<>();
                            ticketData.put("id", ticket.getClass().getMethod("getId").invoke(ticket));
                            ticketData.put("title", ticket.getClass().getMethod("getTitle").invoke(ticket));
                            ticketData.put("description", ticket.getClass().getMethod("getDescription").invoke(ticket));
                            ticketData.put("category", ticket.getClass().getMethod("getCategory").invoke(ticket));
                            ticketData.put("priority", ticket.getClass().getMethod("getPriority").invoke(ticket));
                            ticketData.put("status", ticket.getClass().getMethod("getStatus").invoke(ticket));
                            ticketData.put("assignedTo", ticket.getClass().getMethod("getAssignedTo").invoke(ticket));
                            ticketData.put("createdAt", ticket.getClass().getMethod("getCreatedAt").invoke(ticket));
                            return ticketData;
                        } catch (Exception e) {
                            return new HashMap<String, Object>();
                        }
                    })
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(openTickets);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(List.of(Map.of("error", "Failed to fetch open tickets: " + e.getMessage())));
        }
    }

    /**
     * Get all resources for management
     */
    @GetMapping("/resources")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAllResources() {
        try {
            List<?> resources = resourceService.getAllResources();
            
            List<Map<String, Object>> result = resources.stream()
                    .map(resource -> {
                        try {
                            Map<String, Object> resourceData = new HashMap<>();
                            resourceData.put("id", resource.getClass().getMethod("getId").invoke(resource));
                            resourceData.put("name", resource.getClass().getMethod("getName").invoke(resource));
                            resourceData.put("type", resource.getClass().getMethod("getType").invoke(resource));
                            resourceData.put("capacity", resource.getClass().getMethod("getCapacity").invoke(resource));
                            resourceData.put("status", resource.getClass().getMethod("getStatus").invoke(resource));
                            resourceData.put("location", resource.getClass().getMethod("getLocation").invoke(resource));
                            return resourceData;
                        } catch (Exception e) {
                            return new HashMap<String, Object>();
                        }
                    })
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(List.of(Map.of("error", "Failed to fetch resources: " + e.getMessage())));
        }
    }

    /**
     * Get all users for management
     */
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        try {
            List<User> users = userRepository.findAll();
            
            List<Map<String, Object>> result = users.stream()
                    .map(user -> {
                        Map<String, Object> userData = new HashMap<>();
                        userData.put("id", user.getId());
                        userData.put("name", user.getName());
                        userData.put("email", user.getEmail());
                        userData.put("username", user.getUsername());
                        userData.put("roles", user.getRoles().stream().map(role -> role.name()).collect(Collectors.toList()));
                        userData.put("enabled", user.isEnabled());
                        userData.put("createdAt", user.getCreatedAt());
                        userData.put("lastLoginAt", user.getLastLoginAt());
                        return userData;
                    })
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(List.of(Map.of("error", "Failed to fetch users: " + e.getMessage())));
        }
    }

    /**
     * Get all bookings for management
     */
    @GetMapping("/bookings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAllBookings() {
        try {
            List<Booking> bookings = bookingService.getAllBookings(null, null).stream()
                    .collect(Collectors.toList());
            
            List<Map<String, Object>> result = bookings.stream()
                    .map(booking -> {
                        Map<String, Object> bookingData = new HashMap<>();
                        bookingData.put("id", booking.getId());
                        // Need to fetch related entities properly
                        // bookingData.put("resource", booking.getResource().getName());
                        // bookingData.put("user", booking.getUser().getName());
                        bookingData.put("resource", "Resource Name"); // Placeholder
                        bookingData.put("user", "User Name"); // Placeholder
                        bookingData.put("startTime", booking.getStartTime());
                        bookingData.put("endTime", booking.getEndTime());
                        bookingData.put("status", booking.getStatus());
                        bookingData.put("purpose", booking.getPurpose());
                        bookingData.put("createdAt", booking.getCreatedAt());
                        return bookingData;
                    })
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(List.of(Map.of("error", "Failed to fetch bookings: " + e.getMessage())));
        }
    }

    /**
     * Get all tickets for management
     */
    @GetMapping("/tickets")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAllTickets() {
        try {
            var allTicketsPage = ticketService.getAllTickets(org.springframework.data.domain.PageRequest.of(0, 1000));
            
            List<Map<String, Object>> result = allTicketsPage.getContent().stream()
                    .map(ticket -> {
                        try {
                            Map<String, Object> ticketData = new HashMap<>();
                            ticketData.put("id", ticket.getClass().getMethod("getId").invoke(ticket));
                            ticketData.put("title", ticket.getClass().getMethod("getTitle").invoke(ticket));
                            ticketData.put("description", ticket.getClass().getMethod("getDescription").invoke(ticket));
                            ticketData.put("category", ticket.getClass().getMethod("getCategory").invoke(ticket));
                            ticketData.put("priority", ticket.getClass().getMethod("getPriority").invoke(ticket));
                            ticketData.put("status", ticket.getClass().getMethod("getStatus").invoke(ticket));
                            ticketData.put("assignedTo", ticket.getClass().getMethod("getAssignedTo").invoke(ticket));
                            ticketData.put("createdAt", ticket.getClass().getMethod("getCreatedAt").invoke(ticket));
                            return ticketData;
                        } catch (Exception e) {
                            return new HashMap<String, Object>();
                        }
                    })
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(List.of(Map.of("error", "Failed to fetch tickets: " + e.getMessage())));
        }
    }

    /**
     * Approve a booking
     */
    @PostMapping("/bookings/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> approveBooking(@PathVariable String id, Authentication authentication) {
        try {
            String adminId = authentication.getName();
            bookingService.approveBooking(id, "Approved by admin", adminId);
            return ResponseEntity.ok(Map.of("message", "Booking approved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to approve booking: " + e.getMessage()));
        }
    }

    /**
     * Reject a booking
     */
    @PostMapping("/bookings/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> rejectBooking(@PathVariable String id, @RequestBody Map<String, String> request, Authentication authentication) {
        try {
            String reason = request.get("reason");
            String adminId = authentication.getName();
            bookingService.rejectBooking(id, reason, adminId);
            return ResponseEntity.ok(Map.of("message", "Booking rejected successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to reject booking: " + e.getMessage()));
        }
    }

    /**
     * Update user role
     */
    @PutMapping("/users/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> updateUserRole(@PathVariable String id, @RequestBody Map<String, Object> request) {
        try {
            String role = (String) request.get("role");
            userRepository.findById(id).ifPresent(user -> {
                // Update user role logic here
                userRepository.save(user);
            });
            return ResponseEntity.ok(Map.of("message", "User role updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to update user role: " + e.getMessage()));
        }
    }

    /**
     * Toggle user status (enable/disable)
     */
    @PutMapping("/users/{id}/toggle-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> toggleUserStatus(@PathVariable String id) {
        try {
            userRepository.findById(id).ifPresent(user -> {
                user.setEnabled(!user.isEnabled());
                userRepository.save(user);
            });
            return ResponseEntity.ok(Map.of("message", "User status updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to update user status: " + e.getMessage()));
        }
    }
}
