package com.sliit.uniops.dto.response.ticket;


import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class AttachmentResponseDTO {
     private String id;
    private String ticketId;
    private String fileName;
    private String fileType;
    private long fileSize;
    private String base64Content;  // Base64 for preview
    private String uploadedBy;
    private String uploadedByName;
    private LocalDateTime uploadedAt;
}