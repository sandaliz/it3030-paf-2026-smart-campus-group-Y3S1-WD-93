package com.sliit.uniops.controller;

import com.sliit.uniops.model.Booking;
import com.sliit.uniops.model.User;
import com.sliit.uniops.model.Role;
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
import java.util.ArrayList;
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
            long totalResources = resourceService.getAllResources(null, null, null, null, null, null).size();
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
            List<?> resources = resourceService.getAllResources(null, null, null, null, null, null);
            
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
            System.out.println("DEBUG: Starting to fetch users from database");
            List<User> users = userRepository.findAll();
            System.out.println("DEBUG: Found " + users.size() + " users in database");
            
            List<Map<String, Object>> result = new ArrayList<>();
            for (User user : users) {
                try {
                    Map<String, Object> userData = new HashMap<>();
                    userData.put("id", user.getId());
                    userData.put("name", user.getName());
                    userData.put("email", user.getEmail());
                    userData.put("username", user.getUsername());
                    
                    // Safe role handling - support all required roles
                    List<String> roleNames = new ArrayList<>();
                    try {
                        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
                            System.out.println("DEBUG: User " + user.getId() + " has " + user.getRoles().size() + " roles");
                            for (Object roleObj : user.getRoles()) {
                                if (roleObj != null) {
                                    String roleName = roleObj.toString().toUpperCase();
                                    System.out.println("DEBUG: Processing role: " + roleName);
                                    // Map any role to valid ROLE_ format
                                    switch (roleName) {
                                        case "ADMIN":
                                            roleNames.add("ROLE_ADMIN");
                                            System.out.println("DEBUG: Added ROLE_ADMIN");
                                            break;
                                        case "LECTURER":
                                            roleNames.add("ROLE_LECTURER");
                                            System.out.println("DEBUG: Added ROLE_LECTURER");
                                            break;
                                        case "STUDENT":
                                        case "USER":
                                            roleNames.add("ROLE_STUDENT");
                                            System.out.println("DEBUG: Added ROLE_STUDENT");
                                            break;
                                        case "STAFF":
                                        case "NON_ACADEMIC":
                                            roleNames.add("ROLE_STAFF");
                                            System.out.println("DEBUG: Added ROLE_STAFF");
                                            break;
                                        case "TECHNICIAN":
                                            roleNames.add("ROLE_TECHNICIAN");
                                            System.out.println("DEBUG: Added ROLE_TECHNICIAN");
                                            break;
                                        case "BOOKING_MANAGER":
                                            roleNames.add("ROLE_BOOKING_MANAGER");
                                            System.out.println("DEBUG: Added ROLE_BOOKING_MANAGER");
                                            break;
                                        case "TICKET_MANAGER":
                                            roleNames.add("ROLE_TICKET_MANAGER");
                                            System.out.println("DEBUG: Added ROLE_TICKET_MANAGER");
                                            break;
                                        case "RESOURCE_MANAGER":
                                            roleNames.add("ROLE_RESOURCE_MANAGER");
                                            System.out.println("DEBUG: Added ROLE_RESOURCE_MANAGER");
                                            break;
                                        default:
                                            roleNames.add("ROLE_STUDENT"); // Default fallback
                                            System.out.println("DEBUG: Unknown role " + roleName + ", added ROLE_STUDENT");
                                            break;
                                    }
                                }
                            }
                        } else {
                            roleNames.add("ROLE_STUDENT");
                            System.out.println("DEBUG: No roles found, added ROLE_STUDENT");
                        }
                    } catch (Exception roleEx) {
                        System.err.println("Role processing error for user " + user.getId() + ": " + roleEx.getMessage());
                        roleEx.printStackTrace();
                        roleNames.add("ROLE_STUDENT");
                    }
                    userData.put("roles", roleNames);
                    
                    userData.put("enabled", user.isEnabled());
                    userData.put("createdAt", user.getCreatedAt());
                    userData.put("lastLoginAt", user.getLastLoginAt());
                    
                    result.add(userData);
                } catch (Exception userError) {
                    System.err.println("Skipping user " + user.getId() + " due to error: " + userError.getMessage());
                    // Skip this user but continue with others
                }
            }
            
            System.out.println("DEBUG: Successfully processed " + result.size() + " users");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("Error fetching users: " + e.getMessage());
            e.printStackTrace();
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
     * Create new user
     */
    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> createUser(@RequestBody Map<String, Object> request) {
        try {
            User newUser = new User();
            newUser.setName((String) request.get("name"));
            newUser.setEmail((String) request.get("email"));
            newUser.setUsername((String) request.get("username"));
            newUser.setEnabled(true);
            
            // Set roles
            @SuppressWarnings("unchecked")
            List<String> roles = (List<String>) request.get("roles");
            if (roles != null && !roles.isEmpty()) {
                newUser.setRoles(roles.stream()
                    .map(role -> Role.valueOf(role.replace("ROLE_", "")))
                    .collect(java.util.stream.Collectors.toSet()));
            } else {
                newUser.setRoles(java.util.Set.of(Role.STUDENT));
            }
            
            User savedUser = userRepository.save(newUser);
            return ResponseEntity.ok(Map.of("message", "User created successfully", "userId", savedUser.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to create user: " + e.getMessage()));
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
                // Clear existing roles and set new role
                user.getRoles().clear();
                user.getRoles().add(Role.valueOf(role.replace("ROLE_", "")));
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

    /**
     * Debug endpoint to identify users with invalid roles
     */
    @GetMapping("/debug/users-with-invalid-roles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> debugInvalidRoles() {
        try {
            List<User> users = userRepository.findAll();
            List<Map<String, Object>> problematicUsers = new ArrayList<>();
            List<Map<String, Object>> validUsers = new ArrayList<>();
            
            for (User user : users) {
                Map<String, Object> userInfo = new HashMap<>();
                userInfo.put("id", user.getId());
                userInfo.put("email", user.getEmail());
                userInfo.put("name", user.getName());
                userInfo.put("username", user.getUsername());
                
                List<String> roleNames = new ArrayList<>();
                List<String> invalidRoles = new ArrayList<>();
                boolean hasInvalidRole = false;
                
                if (user.getRoles() != null) {
                    for (Role role : user.getRoles()) {
                        try {
                            if (role != null) {
                                roleNames.add(role.name());
                            }
                        } catch (Exception roleError) {
                            hasInvalidRole = true;
                            invalidRoles.add("Invalid role: " + roleError.getMessage());
                            System.err.println("Invalid role for user " + user.getId() + ": " + roleError.getMessage());
                        }
                    }
                }
                
                userInfo.put("validRoles", roleNames);
                userInfo.put("invalidRoles", invalidRoles);
                
                if (hasInvalidRole) {
                    problematicUsers.add(userInfo);
                } else {
                    validUsers.add(userInfo);
                }
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("problematicUsers", problematicUsers);
            result.put("validUsers", validUsers);
            result.put("totalUsers", users.size());
            result.put("problematicCount", problematicUsers.size());
            result.put("validCount", validUsers.size());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to debug users: " + e.getMessage()));
        }
    }

    /**
     * Delete user
     */
    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable String id) {
        try {
            userRepository.findById(id).ifPresent(user -> {
                userRepository.delete(user);
            });
            return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to delete user: " + e.getMessage()));
        }
    }
}
