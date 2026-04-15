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

@Document(collection = "tickets")
@Data                                  // Generates getters, setters, toString, equals, hash
@NoArgsConstructor                     // Generates empty constructor
@AllArgsConstructor                    // Generates constructor with all fields
public class TicketModel {
    @Id
    
    private String id;
    private String title;
    private String description;
    private String category;
    private String priority;
    private String status;
    private String location;
    private String resourceId;

    @Indexed
    private String createdBy;
    private String assignedTo;
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
        if (this.attachmentIds.size() < 3) {
            this.attachmentIds.add(attachmentId);
        } else {
            throw new IllegalStateException("Maximum 3 attachments allowed");
        }
    }
    
    public void removeAttachment(String attachmentId) {
        this.attachmentIds.remove(attachmentId);
    }
    
    public boolean canAddAttachment() {
        return this.attachmentIds.size() < 3;
    }
}
    
