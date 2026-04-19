package com.sliit.uniops.model;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "resources")
public class Resource {
    @Id
    private String id;
    @Indexed
    private String name;
    @Indexed
    private ResourceType type;
    @Indexed
    private Integer capacity;
    @Indexed
    private String location;
    @Indexed
    private ResourceStatus status;
    private String description;
    private List<AvailabilityWindow> availabilityWindows;
    private List<String> amenities;
    private Integer shareCount;
    private String createdBy; // User ID of who created this resource
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Enums
    public enum ResourceType {
        LECTURE_HALL, LAB, MEETING_ROOM, EQUIPMENT, CLASSROOM, AUDITORIUM, OFFICE
    }

    public enum ResourceStatus {
        ACTIVE, OUT_OF_SERVICE, UNDER_MAINTENANCE, RESERVED
    }

    public static class AvailabilityWindow {
        @NotBlank(message = "Day of week is required")
        @Pattern(regexp = "MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY", message = "Invalid day of week")
        private String dayOfWeek;
        
        @NotBlank(message = "Start time is required")
        @Pattern(regexp = "^([01]?[0-9]|2[0-3]):[0-5][0-9]$", message = "Invalid time format, use HH:MM")
        private String startTime;
        
        @NotBlank(message = "End time is required")
        @Pattern(regexp = "^([01]?[0-9]|2[0-3]):[0-5][0-9]$", message = "Invalid time format, use HH:MM")
        private String endTime;
        
        private boolean available;
        private String[] availableDays;

        public AvailabilityWindow() {}

        public AvailabilityWindow(String dayOfWeek, String startTime, String endTime, boolean available) {
            this.dayOfWeek = dayOfWeek;
            this.startTime = startTime;
            this.endTime = endTime;
            this.available = available;
        }

        // Getters and Setters
        public String getDayOfWeek() { return dayOfWeek; }
        public void setDayOfWeek(String dayOfWeek) { this.dayOfWeek = dayOfWeek; }

        public String getStartTime() { return startTime; }
        public void setStartTime(String startTime) { this.startTime = startTime; }

        public String getEndTime() { return endTime; }
        public void setEndTime(String endTime) { this.endTime = endTime; }

        public boolean isAvailable() { return available; }
        public void setAvailable(boolean available) { this.available = available; }

        public String[] getAvailableDays() { return availableDays; }
        public void setAvailableDays(String[] availableDays) { this.availableDays = availableDays; }
    }
    
}