package com.sliit.uniops.dto.response.ticket;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponseDTO {
     private String id;
    private String ticketId;
    private String authorId;
    private String authorName;
    private String content;
    private boolean isInternal;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean isEdited;
    private boolean isDeleted;

}
