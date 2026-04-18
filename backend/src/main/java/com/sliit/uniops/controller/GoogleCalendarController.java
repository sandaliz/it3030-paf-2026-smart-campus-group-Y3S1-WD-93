package com.sliit.uniops.controller;

import com.google.api.services.calendar.model.Event;
import com.sliit.uniops.model.Booking;
import com.sliit.uniops.security.UserPrincipal;
import com.sliit.uniops.service.BookingService;
import com.sliit.uniops.service.GoogleCalendarService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
    /**
     * Add a specific booking to Google Calendar
     */
    @PostMapping("/add-booking/{bookingId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> addBookingToCalendar(
            @PathVariable String bookingId,
            @RequestHeader("X-Google-Access-Token") String accessToken,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        
        Booking booking = bookingService.getBookingById(bookingId, currentUser.getId(), isAdmin(currentUser));
        
        String eventId = calendarService.addBookingToCalendar(
            currentUser.getId(),
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
            @AuthenticationPrincipal UserPrincipal currentUser) {
        
        List<Booking> bookings = bookingService.getUserBookings(currentUser.getId());
        calendarService.syncAllBookingsToCalendar(currentUser.getId(), bookings, accessToken);
        
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
            @AuthenticationPrincipal UserPrincipal currentUser) {
        
        LocalDateTime start = LocalDateTime.parse(startDate);
        LocalDateTime end = LocalDateTime.parse(endDate);
        
        List<Event> events = calendarService.getUserCalendarEvents(
            currentUser.getId(),
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
            @AuthenticationPrincipal UserPrincipal currentUser) {
        
        Booking booking = bookingService.getBookingById(bookingId, currentUser.getId(), isAdmin(currentUser));
        
        if (booking.getGoogleCalendarEventId() != null) {
            calendarService.deleteCalendarEvent(
                currentUser.getId(),
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

    private boolean isAdmin(UserPrincipal currentUser) {
        return currentUser != null && currentUser.getAuthorities().stream()
            .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }
}
