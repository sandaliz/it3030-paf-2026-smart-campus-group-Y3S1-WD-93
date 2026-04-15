package com.sliit.uniops.service;

import com.sliit.uniops.model.Resource;
//import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.*;
import com.sliit.uniops.model.Booking;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class GoogleCalendarService {
    
    private static final String APPLICATION_NAME = "Smart Campus Booking System";
    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
    
    @Value("${google.calendar.timezone:Asia/Colombo}")
    private String timeZone;
    
    @Autowired(required = false)
    private UserService userService;
    
    @Autowired(required = false)
    private ResourceService resourceService;
    
    /**
     * Add a booking to user's Google Calendar
     */
    public String addBookingToCalendar(String userId, Booking booking, String accessToken) {
        try {
            Calendar service = getCalendarService(accessToken);
            
            // Create calendar event
            Event event = new Event()
                .setSummary(booking.getPurpose())
                .setDescription(buildEventDescription(booking))
                .setLocation(booking.getResourceName() + " - " + getResourceLocation(booking.getResourceId()));
            
            // Set event time
            DateTime startDateTime = new DateTime(
                convertToGoogleDateTime(booking.getDate(), booking.getStartTime())
            );
            DateTime endDateTime = new DateTime(
                convertToGoogleDateTime(booking.getDate(), booking.getEndTime())
            );
            
            EventDateTime start = new EventDateTime()
                .setDateTime(startDateTime)
                .setTimeZone(timeZone);
            EventDateTime end = new EventDateTime()
                .setDateTime(endDateTime)
                .setTimeZone(timeZone);
            
            event.setStart(start);
            event.setEnd(end);
            
            // Add reminders
            Event.Reminders reminders = new Event.Reminders()
                .setUseDefault(false)
                .setOverrides(Arrays.asList(
                    new EventReminder().setMethod("email").setMinutes(60),
                    new EventReminder().setMethod("popup").setMinutes(30)
                ));
            event.setReminders(reminders);
            
            // Add attendees (if applicable)
            if (booking.getExpectedAttendees() != null && booking.getExpectedAttendees() > 0) {
                List<EventAttendee> attendees = new ArrayList<>();
                if (userService != null) {
                    String userEmail = userService.getUserEmail(userId);
                    if (userEmail != null) {
                        attendees.add(new EventAttendee().setEmail(userEmail));
                        event.setAttendees(attendees);
                    }
                }
            }
            
            // Insert event
            String calendarId = "primary";
            Event createdEvent = service.events().insert(calendarId, event).execute();
            
            return createdEvent.getId();
            
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to add booking to Google Calendar: " + e.getMessage());
        }
    }
    
    /**
     * Update booking in Google Calendar when status changes
     */
    public void updateCalendarEvent(String userId, Booking booking, String accessToken) {
        try {
            if (booking.getGoogleCalendarEventId() == null || booking.getGoogleCalendarEventId().isEmpty()) {
                return;
            }
            
            Calendar service = getCalendarService(accessToken);
            String calendarId = "primary";
            
            // Get existing event
            Event event = service.events().get(calendarId, booking.getGoogleCalendarEventId()).execute();
            
            // Update event details based on booking status
            if (booking.getStatus() != null) {
                String statusName = booking.getStatus();
                if ("APPROVED".equals(statusName)) {
                    event.setSummary("✓ " + booking.getPurpose());
                    event.setDescription(buildEventDescription(booking) + "\n\nStatus: APPROVED ✓");
                } else if ("REJECTED".equals(statusName)) {
                    event.setSummary("✗ " + booking.getPurpose() + " (REJECTED)");
                    event.setStatus("cancelled");
                } else if ("CANCELLED".equals(statusName)) {
                    event.setSummary("✗ " + booking.getPurpose() + " (CANCELLED)");
                    event.setStatus("cancelled");
                }
            }
            
            // Update event
            service.events().update(calendarId, booking.getGoogleCalendarEventId(), event).execute();
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    /**
     * Get user's bookings from Google Calendar
     */
    public List<Event> getUserCalendarEvents(String userId, String accessToken, LocalDateTime start, LocalDateTime end) {
        try {
            Calendar service = getCalendarService(accessToken);
            String calendarId = "primary";
            
            DateTime startDateTime = new DateTime(convertToGoogleDateTime(start));
            DateTime endDateTime = new DateTime(convertToGoogleDateTime(end));
            
            Events events = service.events().list(calendarId)
                .setMaxResults(100)
                .setTimeMin(startDateTime)
                .setTimeMax(endDateTime)
                .setOrderBy("startTime")
                .setSingleEvents(true)
                .execute();
            
            return events.getItems();
            
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
    
    /**
     * Delete calendar event when booking is deleted
     */
    public void deleteCalendarEvent(String userId, String eventId, String accessToken) {
        try {
            Calendar service = getCalendarService(accessToken);
            String calendarId = "primary";
            service.events().delete(calendarId, eventId).execute();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    /**
     * Sync all user's approved bookings to calendar
     */
    public void syncAllBookingsToCalendar(String userId, List<Booking> bookings, String accessToken) {
        for (Booking booking : bookings) {
            if (booking.getStatus() != null) {
                if ("APPROVED".equals(booking.getStatus()) && 
                    (booking.getGoogleCalendarEventId() == null || booking.getGoogleCalendarEventId().isEmpty())) {
                    addBookingToCalendar(userId, booking, accessToken);
                } else if (booking.getGoogleCalendarEventId() != null && !booking.getGoogleCalendarEventId().isEmpty()) {
                    updateCalendarEvent(userId, booking, accessToken);
                }
            }
        }
    }
    
    /**
     * Get Google Calendar service instance
     */
    private Calendar getCalendarService(String accessToken) {
        try {
            final NetHttpTransport HTTP_TRANSPORT = GoogleNetHttpTransport.newTrustedTransport();
            
            // Create credential using GoogleCredential with access token
            GoogleCredential credential = new GoogleCredential().setAccessToken(accessToken);
            
            return new Calendar.Builder(HTTP_TRANSPORT, JSON_FACTORY, credential)
                .setApplicationName(APPLICATION_NAME)
                .build();
                
        } catch (Exception e) {
            throw new RuntimeException("Failed to create calendar service", e);
        }
    }
    
    /**
     * Helper methods
     */
    private String convertToGoogleDateTime(LocalDate date, LocalTime time) {
        if (date == null || time == null) {
            return LocalDateTime.now().atZone(ZoneId.of(timeZone))
                .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        }
        LocalDateTime dateTime = LocalDateTime.of(date, time);
        return dateTime.atZone(ZoneId.of(timeZone))
            .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
    }
    
    private String convertToGoogleDateTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            dateTime = LocalDateTime.now();
        }
        return dateTime.atZone(ZoneId.of(timeZone))
            .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
    }
    
    private String buildEventDescription(Booking booking) {
        StringBuilder desc = new StringBuilder();
        desc.append("Smart Campus Booking Details:\n");
        desc.append("━━━━━━━━━━━━━━━━━━━━━━━━\n");
        desc.append("Resource: ").append(booking.getResourceName()).append("\n");
        desc.append("Date: ").append(booking.getDate()).append("\n");
        desc.append("Time: ").append(booking.getStartTime()).append(" - ").append(booking.getEndTime()).append("\n");
        desc.append("Purpose: ").append(booking.getPurpose()).append("\n");
        if (booking.getExpectedAttendees() != null) {
            desc.append("Expected Attendees: ").append(booking.getExpectedAttendees()).append("\n");
        }
        desc.append("Status: ").append(booking.getStatus()).append("\n");
        desc.append("Booking ID: ").append(booking.getId()).append("\n");
        desc.append("━━━━━━━━━━━━━━━━━━━━━━━━\n");
        desc.append("To manage this booking, visit the Smart Campus Portal.");
        return desc.toString();
    }
    
    private String getResourceLocation(String resourceId) {
        if (resourceService != null) {
            try {
                Resource resource = resourceService.getResourceById(resourceId);
                return resource != null ? resource.getLocation() : "Location not specified";
            } catch (Exception e) {
                return "Location not specified";
            }
        }
        return "Location not specified";
    }
}