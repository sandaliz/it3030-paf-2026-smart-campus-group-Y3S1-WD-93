package com.sliit.uniops.model.ticket;

import lombok.*;
import java.time.LocalDateTime;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

@Document(collection = "comments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentModel {
    @Id
   private String id;
    
    private String ticketId;
    
    private String authorId;
    
    private String authorName;
    
    private String content;
    
    private boolean isInternal;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    private boolean isEdited = false;
    
    private boolean isDeleted = false;
    
    public void updateContent(String newContent) {
        this.content = newContent;
        this.isEdited = true;
        this.updatedAt = LocalDateTime.now();
    }
}
