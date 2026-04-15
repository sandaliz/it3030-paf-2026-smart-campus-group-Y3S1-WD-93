package com.sliit.uniops.dto.request;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalTime;

public class BookingUpdateRequestDTO {
    
    private String resourceId;
    
    @FutureOrPresent(message = "Date cannot be in the past")
    private LocalDate date;
    
    private LocalTime startTime;
    private LocalTime endTime;
    
    @Size(max = 500, message = "Purpose cannot exceed 500 characters")
    private String purpose;
    
    @Min(value = 1, message = "Expected attendees must be at least 1")
    @Max(value = 1000, message = "Expected attendees cannot exceed 1000")
    private Integer expectedAttendees;
    
    // Custom validation for time range (only if both times are provided)
    @AssertTrue(message = "End time must be after start time")
    public boolean isEndTimeAfterStartTime() {
        if (startTime == null || endTime == null) return true;
        return endTime.isAfter(startTime);
    }
    
    // Getters and Setters
    public String getResourceId() { return resourceId; }
    public void setResourceId(String resourceId) { this.resourceId = resourceId; }
    
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    
    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
    
    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
    
    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
    
    public Integer getExpectedAttendees() { return expectedAttendees; }
    public void setExpectedAttendees(Integer expectedAttendees) { this.expectedAttendees = expectedAttendees; }
    
    // Helper method to check if any field is provided for update
    public boolean hasUpdates() {
        return resourceId != null || date != null || startTime != null || 
               endTime != null || purpose != null || expectedAttendees != null;
    }
}