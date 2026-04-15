package com.sliit.uniops.model.ticket;

import lombok.*;
import java.time.LocalDateTime;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

@Document(collection = "comments")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class CommentModel {
    @Id
    private String id;
    
    private String ticketId;
    
    private String authorId;
    
    private String authorName;
    
    private String content;
    
    private boolean isInternal;   // Internal notes (technician/admin only) vs public comments
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    private boolean isEdited = false;
    
    private boolean isDeleted = false;

    // Constructor for new comment
    public CommentModel(String ticketId, String authorId, String authorName, 
                       String content, boolean isInternal) {
        this.ticketId = ticketId;
        this.authorId = authorId;
        this.authorName = authorName;
        this.content = content;
        this.isInternal = isInternal;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.isEdited = false;
        this.isDeleted = false;
    }
    
    // Update content method
    public void updateContent(String newContent) {
        this.content = newContent;
        this.isEdited = true;
        this.updatedAt = LocalDateTime.now();
    }
    
    // Soft delete
    public void softDelete() {
        this.isDeleted = true;
        this.content = "[This comment has been deleted]";
        this.updatedAt = LocalDateTime.now();
    }
}