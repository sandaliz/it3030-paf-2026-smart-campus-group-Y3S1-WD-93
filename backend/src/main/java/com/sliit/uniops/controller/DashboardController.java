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
import java.util.ArrayList;
import java.util.stream.Collectors;

/**
 * Controller for role-specific dashboard statistics and overview data
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class DashboardController {

    private final UserRepository userRepository;
    private final BookingService bookingService;
    private final TicketService ticketService;
    private final ResourceService resourceService;

    /**
     * Get lecturer dashboard statistics
     */
    @GetMapping("/lecturer/dashboard/stats")
    @PreAuthorize("hasRole('LECTURER')")
    public ResponseEntity<Map<String, Object>> getLecturerDashboardStats(Authentication authentication) {
        try {
            String lecturerId = authentication.getName();
            Map<String, Object> stats = new HashMap<>();
            
            // Get lecturer's bookings
            List<Booking> lecturerBookings = bookingService.getAllBookings(null, null, lecturerId, null, null);
            stats.put("myBookings", lecturerBookings.size());
            
            // Get lecturer's resources (simplified - assume resources they manage)
            long myResources = resourceService.getAllResources(null, null, null, null, null, null).stream()
                    .filter(resource -> {
                        try {
                            // Filter resources that lecturer might manage
                            return resource.getClass().getMethod("getType").invoke(resource).toString().contains("LAB");
                        } catch (Exception e) {
                            return false;
                        }
                    })
                    .count();
            stats.put("myResources", myResources);
            
            // Get upcoming classes (future bookings)
            long upcomingClasses = lecturerBookings.stream()
                    .filter(booking -> {
                        try {
                            // Combine date and time to create LocalDateTime
                            java.time.LocalDateTime bookingDateTime = java.time.LocalDateTime.of(booking.getDate(), booking.getStartTime());
                            return bookingDateTime.isAfter(java.time.LocalDateTime.now());
                        } catch (Exception e) {
                            return false;
                        }
                    })
                    .count();
            stats.put("upcomingClasses", upcomingClasses);
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to fetch lecturer dashboard stats: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Get lecturer recent activity
     */
    @GetMapping("/lecturer/dashboard/activity")
    @PreAuthorize("hasRole('LECTURER')")
    public ResponseEntity<List<Map<String, Object>>> getLecturerActivity(Authentication authentication) {
        try {
            String lecturerId = authentication.getName();
            List<Map<String, Object>> activities = new ArrayList<>();
            
            // Get recent bookings
            List<Booking> recentBookings = bookingService.getAllBookings(null, null, lecturerId, null, null).stream()
                    .filter(booking -> {
                        try {
                            return booking.getCreatedAt().isAfter(java.time.LocalDateTime.now().minusDays(7));
                        } catch (Exception e) {
                            return false;
                        }
                    })
                    .collect(Collectors.toList());
            
            for (Booking booking : recentBookings) {
                Map<String, Object> activity = new HashMap<>();
                activity.put("description", "Booking created for " + booking.getPurpose());
                activity.put("timestamp", booking.getCreatedAt());
                activities.add(activity);
            }
            
            return ResponseEntity.ok(activities);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(List.of(Map.of("error", "Failed to fetch lecturer activity: " + e.getMessage())));
        }
    }

    /**
     * Get student dashboard statistics
     */
    @GetMapping("/student/dashboard/stats")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Map<String, Object>> getStudentDashboardStats(Authentication authentication) {
        try {
            String studentId = authentication.getName();
            Map<String, Object> stats = new HashMap<>();
            
            // Get student's bookings
            List<Booking> studentBookings = bookingService.getAllBookings(null, null, studentId, null, null);
            stats.put("myBookings", studentBookings.size());
            
            // Get student's resources (resources they have access to)
            long myResources = studentBookings.stream()
                    .map(Booking::getResourceId)
                    .distinct()
                    .count();
            stats.put("myResources", myResources);
            
            // Get active tickets
            var studentTickets = ticketService.getAllTickets(org.springframework.data.domain.PageRequest.of(0, 1000));
            long activeTickets = studentTickets.getContent().stream()
                    .filter(ticket -> {
                        try {
                            Object status = ticket.getClass().getMethod("getStatus").invoke(ticket);
                            Object userId = ticket.getClass().getMethod("getUserId").invoke(ticket);
                            return "OPEN".equals(status.toString()) && studentId.equals(userId.toString());
                        } catch (Exception e) {
                            return false;
                        }
                    })
                    .count();
            stats.put("activeTickets", activeTickets);
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to fetch student dashboard stats: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Get student recent activity
     */
    @GetMapping("/student/dashboard/activity")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<Map<String, Object>>> getStudentActivity(Authentication authentication) {
        try {
            String studentId = authentication.getName();
            List<Map<String, Object>> activities = new ArrayList<>();
            
            // Get recent bookings
            List<Booking> recentBookings = bookingService.getAllBookings(null, null, studentId, null, null).stream()
                    .filter(booking -> {
                        try {
                            return booking.getCreatedAt().isAfter(java.time.LocalDateTime.now().minusDays(7));
                        } catch (Exception e) {
                            return false;
                        }
                    })
                    .collect(Collectors.toList());
            
            for (Booking booking : recentBookings) {
                Map<String, Object> activity = new HashMap<>();
                activity.put("description", "Booking " + booking.getStatus().toLowerCase() + " for " + booking.getPurpose());
                activity.put("timestamp", booking.getCreatedAt());
                activities.add(activity);
            }
            
            // Get recent tickets
            var studentTickets = ticketService.getAllTickets(org.springframework.data.domain.PageRequest.of(0, 1000));
            studentTickets.getContent().stream()
                    .filter(ticket -> {
                        try {
                            Object createdAt = ticket.getClass().getMethod("getCreatedAt").invoke(ticket);
                            Object userId = ticket.getClass().getMethod("getUserId").invoke(ticket);
                            return ((java.time.LocalDateTime) createdAt).isAfter(java.time.LocalDateTime.now().minusDays(7)) && studentId.equals(userId.toString());
                        } catch (Exception e) {
                            return false;
                        }
                    })
                    .forEach(ticket -> {
                        try {
                            Map<String, Object> activity = new HashMap<>();
                            Object title = ticket.getClass().getMethod("getTitle").invoke(ticket);
                            Object createdAt = ticket.getClass().getMethod("getCreatedAt").invoke(ticket);
                            activity.put("description", "Ticket created: " + title);
                            activity.put("timestamp", createdAt);
                            activities.add(activity);
                        } catch (Exception e) {
                            // Skip if error
                        }
                    });
            
            return ResponseEntity.ok(activities);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(List.of(Map.of("error", "Failed to fetch student activity: " + e.getMessage())));
        }
    }

    /**
     * Get staff dashboard statistics
     */
    @GetMapping("/staff/dashboard/stats")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<Map<String, Object>> getStaffDashboardStats(Authentication authentication) {
        try {
            String staffId = authentication.getName();
            Map<String, Object> stats = new HashMap<>();
            
            // Get staff's managed resources
            long myResources = resourceService.getAllResources(null, null, null, null, null, null).stream()
                    .filter(resource -> {
                        try {
                            // Filter resources that staff might manage
                            Object type = resource.getClass().getMethod("getType").invoke(resource);
                            return type.toString().contains("EQUIPMENT") || type.toString().contains("FACILITY");
                        } catch (Exception e) {
                            return false;
                        }
                    })
                    .count();
            stats.put("myResources", myResources);
            
            // Get resource requests (simplified - count pending bookings as requests)
            List<Booking> pendingBookings = bookingService.getAllBookings("PENDING", null);
            stats.put("resourceRequests", pendingBookings.size());
            
            // Get pending approvals (same as resource requests for staff)
            stats.put("pendingApprovals", pendingBookings.size());
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to fetch staff dashboard stats: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Get staff recent activity
     */
    @GetMapping("/staff/dashboard/activity")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<List<Map<String, Object>>> getStaffActivity(Authentication authentication) {
        try {
            List<Map<String, Object>> activities = new ArrayList<>();
            
            // Get recent bookings that need staff attention
            List<Booking> recentBookings = bookingService.getAllBookings(null, null).stream()
                    .filter(booking -> {
                        try {
                            return booking.getCreatedAt().isAfter(java.time.LocalDateTime.now().minusDays(7));
                        } catch (Exception e) {
                            return false;
                        }
                    })
                    .collect(Collectors.toList());
            
            for (Booking booking : recentBookings) {
                Map<String, Object> activity = new HashMap<>();
                activity.put("description", "New booking request: " + booking.getPurpose());
                activity.put("timestamp", booking.getCreatedAt());
                activities.add(activity);
            }
            
            return ResponseEntity.ok(activities);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(List.of(Map.of("error", "Failed to fetch staff activity: " + e.getMessage())));
        }
    }

    /**
     * Get user's bookings (generic endpoint)
     */
    @GetMapping("/user/bookings")
    public ResponseEntity<List<Map<String, Object>>> getUserBookings(Authentication authentication) {
        try {
            String userId = authentication.getName();
            List<Booking> userBookings = bookingService.getAllBookings(null, null, userId, null, null);
            
            List<Map<String, Object>> result = userBookings.stream()
                    .map(booking -> {
                        Map<String, Object> bookingData = new HashMap<>();
                        bookingData.put("id", booking.getId());
                        bookingData.put("resource", "Resource Name"); // Placeholder - will be filled by frontend
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
            return ResponseEntity.status(500).body(List.of(Map.of("error", "Failed to fetch user bookings: " + e.getMessage())));
        }
    }

    private String getResourceName(String resourceId) {
        try {
            var resource = resourceService.getResourceById(resourceId);
            if (resource != null) {
                Object name = resource.getClass().getMethod("getName").invoke(resource);
                return name != null ? name.toString() : "Unknown Resource";
            }
        } catch (Exception e) {
            // Ignore and return placeholder
        }
        return "Resource Name";
    }

    /**
     * Get user's resources (generic endpoint)
     */
    @GetMapping("/user/resources")
    public ResponseEntity<List<Map<String, Object>>> getUserResources(Authentication authentication) {
        try {
            String userId = authentication.getName();
            List<Booking> userBookings = bookingService.getAllBookings(null, null, userId, null, null);
            
            // Get unique resources from user's bookings
            List<Map<String, Object>> resources = userBookings.stream()
                    .map(booking -> {
                        Map<String, Object> resourceData = new HashMap<>();
                        resourceData.put("id", booking.getResourceId());
                        resourceData.put("name", booking.getResourceName());
                        resourceData.put("type", booking.getResourceType());
                        return resourceData;
                    })
                    .filter(resource -> resource != null)
                    .distinct()
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(resources);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(List.of(Map.of("error", "Failed to fetch user resources: " + e.getMessage())));
        }
    }

    /**
     * Get user's tickets (generic endpoint)
     */
    @GetMapping("/user/tickets")
    public ResponseEntity<List<Map<String, Object>>> getUserTickets(Authentication authentication) {
        try {
            String userId = getUserId(authentication);
            var userTickets = ticketService.getAllTickets(org.springframework.data.domain.PageRequest.of(0, 1000));
            
            List<Map<String, Object>> result = userTickets.getContent().stream()
                    .filter(ticket -> {
                        try {
                            Object ticketUserId = ticket.getClass().getMethod("getUserId").invoke(ticket);
                            return userId.equals(ticketUserId.toString());
                        } catch (Exception e) {
                            return false;
                        }
                    })
                    .map(ticket -> {
                        try {
                            Map<String, Object> ticketData = new HashMap<>();
                            ticketData.put("id", ticket.getClass().getMethod("getId").invoke(ticket));
                            ticketData.put("title", ticket.getClass().getMethod("getTitle").invoke(ticket));
                            ticketData.put("status", ticket.getClass().getMethod("getStatus").invoke(ticket));
                            ticketData.put("priority", ticket.getClass().getMethod("getPriority").invoke(ticket));
                            ticketData.put("category", ticket.getClass().getMethod("getCategory").invoke(ticket));
                            ticketData.put("createdAt", ticket.getClass().getMethod("getCreatedAt").invoke(ticket));
                            return ticketData;
                        } catch (Exception e) {
                            return null;
                        }
                    })
                    .filter(ticket -> ticket != null)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(List.of(Map.of("error", "Failed to fetch user tickets: " + e.getMessage())));
        }
    }

    private String getUserId(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof com.sliit.uniops.security.UserPrincipal user) {
            return user.getId();
        }
        return authentication.getName();
    }
}
