package com.sliit.uniops.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;

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
    private List<String> assignedStaff; // List of user IDs assigned to this resource
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
        private String dayOfWeek;
        private String startTime;
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
    
    public Resource() {}
    
    public Resource(String id, String name, ResourceType type, Integer capacity, String location, ResourceStatus status) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.capacity = capacity;
        this.location = location;
        this.status = status;
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public ResourceType getType() { return type; }
    public void setType(ResourceType type) { this.type = type; }
    
    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }
    
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    
    public ResourceStatus getStatus() { return status; }
    public void setStatus(ResourceStatus status) { this.status = status; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public List<AvailabilityWindow> getAvailabilityWindows() { return availabilityWindows; }
    public void setAvailabilityWindows(List<AvailabilityWindow> availabilityWindows) { this.availabilityWindows = availabilityWindows; }
    
    public List<String> getAmenities() { return amenities; }
    public void setAmenities(List<String> amenities) { this.amenities = amenities; }

    public Integer getShareCount() { return shareCount; }
    public void setShareCount(Integer shareCount) { this.shareCount = shareCount; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public List<String> getAssignedStaff() { return assignedStaff; }
    public void setAssignedStaff(List<String> assignedStaff) { this.assignedStaff = assignedStaff; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}