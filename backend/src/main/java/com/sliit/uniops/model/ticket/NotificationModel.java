package com.sliit.uniops.model.ticket;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor

public class NotificationModel {
    @Id
    private String id;
    private String userId;
    
    private String type;
    
    private String message;
    private String title;
    
    private String ticketId;
    
    private boolean isRead;
    
    private LocalDateTime createdAt;
}
