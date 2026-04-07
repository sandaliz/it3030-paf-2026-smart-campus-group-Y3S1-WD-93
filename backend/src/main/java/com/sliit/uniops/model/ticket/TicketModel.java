package com.sliit.uniops.model.ticket;

import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import com.sliit.uniops.util.enums.TicketCategory;
import com.sliit.uniops.util.enums.TicketPriority;
import com.sliit.uniops.util.enums.TicketStatus;



@Document(collection = "tickets")
@Data                                  // Generates getters, setters, toString, equals, hash
@NoArgsConstructor                     // Generates empty constructor
@AllArgsConstructor                    // Generates constructor with all fields
public class TicketModel {
    @Id
    
    private String id;
    private String title;
    private String description;
    private TicketCategory category;
    private TicketPriority priority;
    private TicketStatus status;
    private String location;
    private String resourceId;

    @Indexed
    private String createdBy;
    private String createdByName;
    private String assignedTo;
    private String assignedToName;
    private List<String> attachmentIds = new ArrayList<>();
    private String resolutionNotes;
    private String rejectionReason;
  

    @CreatedDate
    private LocalDateTime createdAt;
    @LastModifiedDate
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime closedAt;
    private LocalDateTime firstResponseAt;
    private boolean isDeleted = false;

     // Helper methods
    public void addAttachment(String attachmentId) {
        if (this.attachmentIds == null) {
            this.attachmentIds = new ArrayList<>();
        }
        if (this.attachmentIds.size() >= 3) {
            throw new IllegalStateException("Maximum 3 attachments allowed per ticket");
        }
        this.attachmentIds.add(attachmentId);
    }
    
    public void removeAttachment(String attachmentId) {
        this.attachmentIds.remove(attachmentId);
    }
    
    public boolean canAddAttachment() {
        return this.attachmentIds != null && this.attachmentIds.size() < 3;
    }
    
    public void transitionTo(TicketStatus newStatus, String reason) {
        if (!this.status.canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                String.format("Cannot transition from %s to %s", this.status, newStatus));
        }
        
        this.status = newStatus;
        this.updatedAt = LocalDateTime.now();
        
        switch (newStatus) {
            case IN_PROGRESS:
                if (firstResponseAt == null) {
                    firstResponseAt = LocalDateTime.now();
                }
                break;
            case RESOLVED:
                resolvedAt = LocalDateTime.now();
                resolutionNotes = reason;
                break;
            case REJECTED:
                rejectionReason = reason;
                break;
            case CLOSED:
                closedAt = LocalDateTime.now();
                break;
        }
    }
}