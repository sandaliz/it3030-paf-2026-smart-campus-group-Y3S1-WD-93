package com.sliit.uniops.model.ticket;

import java.time.LocalDateTime;
import lombok.*;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;



@Document(collection = "attachments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentModel {
    @Id
    private String id;
    private String ticketId;
    private String fileName;
    private String fileType;

    @org.springframework.data.mongodb.core.mapping.Field("base64Content")
    private String base64Content;
    private String fileUrl;
    private long fileSize;
    private String uploadedBy;
    private String uploadedByName;

    @CreatedDate
    private LocalDateTime uploadedAt;
    private boolean isDeleted;
  
    
      // Constructor without id (for new attachments)
    public AttachmentModel(String ticketId, String fileType, 
                      long fileSize, String base64Content, String uploadedBy, String uploadedByName) {
        this.ticketId = ticketId;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.base64Content = base64Content;
        this.uploadedBy = uploadedBy;
        this.uploadedByName = uploadedByName;
        this.uploadedAt = LocalDateTime.now();
        this.isDeleted = false;
        
        
    }
}