package com.sliit.uniops.controller;

import com.google.api.services.calendar.model.Event;
import com.sliit.uniops.model.Booking;
import com.sliit.uniops.model.User;
import com.sliit.uniops.exception.UnauthorizedException;
import com.sliit.uniops.repository.UserRepository;
import com.sliit.uniops.security.UserPrincipal;
import com.sliit.uniops.service.BookingService;
import com.sliit.uniops.service.GoogleCalendarService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/calendar")
@CrossOrigin(origins = "http://localhost:5173")
public class GoogleCalendarController {
    
    @Autowired
    private GoogleCalendarService calendarService;
    
    @Autowired
    private BookingService bookingService;

    @Autowired
    private UserRepository userRepository;
    
    /**
     * Add a specific booking to Google Calendar
     */
    @PostMapping("/add-booking/{bookingId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> addBookingToCalendar(
            @PathVariable String bookingId,
            @RequestHeader("X-Google-Access-Token") String accessToken,
            Authentication authentication) {
        
        String currentUserId = getCurrentUserId(authentication);
        Booking booking = bookingService.getBookingById(bookingId, currentUserId, isAdmin(authentication));
        
        String eventId = calendarService.addBookingToCalendar(
            currentUserId,
            booking,
            accessToken
        );
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Booking added to Google Calendar successfully");
        response.put("eventId", eventId);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Add current user's all approved bookings to Google Calendar
     */
    @PostMapping("/sync-all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> syncAllBookingsToCalendar(
            @RequestHeader("X-Google-Access-Token") String accessToken,
            Authentication authentication) {
        
        String currentUserId = getCurrentUserId(authentication);
        List<Booking> bookings = bookingService.getUserBookings(currentUserId);
        calendarService.syncAllBookingsToCalendar(currentUserId, bookings, accessToken);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "All bookings synced to Google Calendar successfully");
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get user's calendar events for a date range
     */
    @GetMapping("/events")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Event>> getCalendarEvents(
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestHeader("X-Google-Access-Token") String accessToken,
            Authentication authentication) {
        
        LocalDateTime start = LocalDateTime.parse(startDate);
        LocalDateTime end = LocalDateTime.parse(endDate);
        
        List<Event> events = calendarService.getUserCalendarEvents(
            getCurrentUserId(authentication),
            accessToken,
            start,
            end
        );
        
        return ResponseEntity.ok(events);
    }
    
    /**
     * Remove a booking from Google Calendar
     */
    @DeleteMapping("/remove-booking/{bookingId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> removeBookingFromCalendar(
            @PathVariable String bookingId,
            @RequestHeader("X-Google-Access-Token") String accessToken,
            Authentication authentication) {
        
        String currentUserId = getCurrentUserId(authentication);
        Booking booking = bookingService.getBookingById(bookingId, currentUserId, isAdmin(authentication));
        
        if (booking.getGoogleCalendarEventId() != null) {
            calendarService.deleteCalendarEvent(
                currentUserId,
                booking.getGoogleCalendarEventId(),
                accessToken
            );
        }

        booking.setGoogleCalendarEventId(null);
        booking.setCalendarSynced(false);
        booking.setLastCalendarSync(LocalDateTime.now());
        bookingService.save(booking);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Booking removed from Google Calendar");
        
        return ResponseEntity.ok(response);
    }

    private String getCurrentUserId(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new UnauthorizedException("User is not authenticated");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof UserPrincipal userPrincipal) {
            return userPrincipal.getId();
        }

        String email = null;
        if (principal instanceof OAuth2User oauth2User) {
            Object emailAttr = oauth2User.getAttributes().get("email");
            if (emailAttr != null) {
                email = emailAttr.toString();
            }
        } else if (principal instanceof org.springframework.security.core.userdetails.UserDetails userDetails) {
            email = userDetails.getUsername();
        } else if (principal instanceof String principalString && !"anonymousUser".equals(principalString)) {
            email = principalString;
        }

        if (email == null || email.isBlank()) {
            throw new UnauthorizedException("Authenticated user details are unavailable");
        }

        User user = userRepository.findByEmail(email.toLowerCase().trim())
            .orElseThrow(() -> new UnauthorizedException("Authenticated user was not found"));
        return user.getId();
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication != null &&
            authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }
}
