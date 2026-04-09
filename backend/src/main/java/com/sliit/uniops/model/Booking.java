package com.sliit.uniops.model;

import lombok.Data;
//import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
//@NoArgsConstructor
@Document(collection = "bookings")
@CompoundIndex(name = "resource_time_idx", 
                def = "{'resourceId': 1, 'date': 1, 'startTime': 1, 'endTime': 1}")
public class Booking {
    
    @Id
    private String id;
    
    @Indexed
    private String userId;
    
    @Indexed
    private String resourceId;
    
    private String resourceName;
    private Resource.ResourceType resourceType;
    
    @Indexed
    private LocalDate date;
    
    private LocalTime startTime;
    private LocalTime endTime;
    
    private String purpose;
    private Integer expectedAttendees;
    
    private BookingStatus status;
    private String rejectionReason;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Enum for Booking Status
    public enum BookingStatus {
        PENDING, APPROVED, REJECTED, CANCELLED
    }
    
    // Constructor
    public Booking() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.status = BookingStatus.PENDING;
    }
    
    // Set timestamps before persisting
    public void setTimestamps() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        this.updatedAt = LocalDateTime.now();
    }
}