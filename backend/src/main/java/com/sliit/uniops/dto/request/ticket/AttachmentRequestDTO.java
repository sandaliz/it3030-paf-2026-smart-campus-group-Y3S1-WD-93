package com.sliit.uniops.dto.request.ticket;



import lombok.Data;


@Data
public class AttachmentRequestDTO {
    private String fileName;
    private String fileType;
    private String base64Content;  // Base64 encoded image string
    private long fileSize;
}