package com.sliit.uniops.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "resources")
public class Resource {
    
    @Id
    private String id;
    
    @NotBlank(message = "Resource name is required")
    @Indexed(unique = true)
    private String name;
    
    @NotNull(message = "Resource type is required")
    private ResourceType type;
    
    @Min(value = 1, message = "Capacity must be at least 1")
    private int capacity;
    
    @NotBlank(message = "Location is required")
    private String location;
    
    private List<AvailabilityWindow> availabilityWindows;
    
    @NotNull(message = "Status is required")
    private ResourceStatus status;
    
    private String description;
    
    private List<String> amenities;
    
    @PastOrPresent
    private LocalDateTime createdAt;
    
    @PastOrPresent
    private LocalDateTime updatedAt;
    
    // Enum for Resource Type
    public enum ResourceType {
        LECTURE_HALL, LAB, MEETING_ROOM, EQUIPMENT, OFFICE, AUDITORIUM
    }
    
    // Enum for Resource Status
    public enum ResourceStatus {
        ACTIVE, OUT_OF_SERVICE, UNDER_MAINTENANCE
    }
    
    // Inner class for availability windows
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AvailabilityWindow {
        private String dayOfWeek; // MONDAY, TUESDAY, etc.
        private String startTime; // "09:00"
        private String endTime;   // "17:00"
        private boolean available;
    }
    
    // Set timestamps before persisting
    public void setTimestamps() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        this.updatedAt = LocalDateTime.now();
    }
}