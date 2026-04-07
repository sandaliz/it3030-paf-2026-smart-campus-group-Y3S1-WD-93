package com.sliit.uniops.service.ticket;


import com.sliit.uniops.dto.request.ticket.AttachmentRequestDTO;
import com.sliit.uniops.dto.response.ticket.AttachmentResponseDTO;
import com.sliit.uniops.model.ticket.AttachmentModel;
import com.sliit.uniops.model.ticket.TicketModel;
import com.sliit.uniops.repository.ticket.AttachmentRepository;
import com.sliit.uniops.repository.ticket.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttachmentService {
    
    private final AttachmentRepository attachmentRepository;
    private final TicketRepository ticketRepository;
    
    private static final int MAX_ATTACHMENTS_PER_TICKET = 3;
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    
    // Upload from MultipartFile (converts to Base64)
    @Transactional
    public AttachmentResponseDTO uploadAttachment(MultipartFile file, String ticketId, 
                                                   String userId, String userName) {
        log.info("Uploading attachment for ticket: {}", ticketId);
        
        try {
            // Validate
            validateFile(file);
            
            // Check ticket exists
            TicketModel ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found with ID: " + ticketId));
            
            // Check attachment limit
            long currentAttachments = attachmentRepository.countActiveByTicketId(ticketId);
            if (currentAttachments >= MAX_ATTACHMENTS_PER_TICKET) {
                throw new IllegalStateException(
                    String.format("Maximum %d attachments allowed per ticket. Current: %d", 
                        MAX_ATTACHMENTS_PER_TICKET, currentAttachments));
            }
            
            // Convert file to Base64
            byte[] fileBytes = file.getBytes();
            String base64Content = Base64.getEncoder().encodeToString(fileBytes);
            
            // Create attachment
            AttachmentModel attachment = new AttachmentModel(
                ticketId,
                file.getContentType(),
                file.getSize(),
                base64Content,
                userId,
                userName
            );
            
            AttachmentModel savedAttachment = attachmentRepository.save(attachment);
            
            // Update ticket with attachment ID
            if (ticket.getAttachmentIds() == null) {
                ticket.setAttachmentIds(new ArrayList<>());
            }
            ticket.getAttachmentIds().add(savedAttachment.getId());
            ticketRepository.save(ticket);
            
            log.info("Attachment uploaded successfully. ID: {}, Size: {} bytes", 
                savedAttachment.getId(), savedAttachment.getFileSize());
            
            return convertToResponseDTO(savedAttachment);
            
        } catch (IOException e) {
            log.error("Failed to upload file", e);
            throw new RuntimeException("Failed to upload file: " + e.getMessage());
        }
    }
    
    // Upload from Base64 string (for frontend)
    @Transactional
    public AttachmentResponseDTO uploadBase64Attachment(AttachmentRequestDTO request, 
                                                         String ticketId, 
                                                         String userId, 
                                                         String userName) {
        log.info("Uploading Base64 attachment for ticket: {}", ticketId);
        
        // Validate Base64 content
        if (request.getBase64Content() == null || request.getBase64Content().isEmpty()) {
            throw new IllegalArgumentException("Base64 content is required");
        }
        
        // Validate file size (approximate)
        long approximateSize = request.getBase64Content().length() * 3 / 4;
        if (approximateSize > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                String.format("File size exceeds %d MB limit", MAX_FILE_SIZE / (1024 * 1024)));
        }
        
        // Check ticket exists
        TicketModel ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new RuntimeException("Ticket not found with ID: " + ticketId));
        
        // Check attachment limit
        long currentAttachments = attachmentRepository.countActiveByTicketId(ticketId);
        if (currentAttachments >= MAX_ATTACHMENTS_PER_TICKET) {
            throw new IllegalStateException(
                String.format("Maximum %d attachments allowed per ticket", MAX_ATTACHMENTS_PER_TICKET));
        }
        
        // Remove data:image/png;base64, prefix if present
        String base64Content = request.getBase64Content();
        if (base64Content.contains(",")) {
            base64Content = base64Content.substring(base64Content.indexOf(",") + 1);
        }
        
        // Create attachment
        AttachmentModel attachment = new AttachmentModel(
            ticketId,
            request.getFileName(),
            request.getFileType(),
            request.getFileSize(),
            base64Content,
            userId,
            userName
        );
        
        AttachmentModel savedAttachment = attachmentRepository.save(attachment);
        
        // Update ticket
        if (ticket.getAttachmentIds() == null) {
            ticket.setAttachmentIds(new ArrayList<>());
        }
        ticket.getAttachmentIds().add(savedAttachment.getId());
        ticketRepository.save(ticket);
        
        log.info("Base64 attachment uploaded successfully: {}", savedAttachment.getId());
        
        return convertToResponseDTO(savedAttachment);
    }
    
    @Transactional
    public void deleteAttachment(String attachmentId, String userId, boolean isAdmin) {
        log.info("Deleting attachment: {}", attachmentId);
        
        AttachmentModel attachment = attachmentRepository.findById(attachmentId)
            .orElseThrow(() -> new RuntimeException("Attachment not found with ID: " + attachmentId));
        
        // Check permission
        if (!attachment.getUploadedBy().equals(userId) && !isAdmin) {
            throw new SecurityException("You don't have permission to delete this attachment");
        }
        
        // Soft delete
        attachment.setDeleted(true);
        attachmentRepository.save(attachment);
        
        // Remove from ticket
        TicketModel ticket = ticketRepository.findById(attachment.getTicketId())
            .orElse(null);
        if (ticket != null && ticket.getAttachmentIds() != null) {
            ticket.getAttachmentIds().remove(attachmentId);
            ticketRepository.save(ticket);
        }
        
        log.info("Attachment deleted: {}", attachmentId);
    }
    
    public List<AttachmentResponseDTO> getAttachmentsByTicket(String ticketId) {
        List<AttachmentModel> attachments = attachmentRepository.findByTicketIdAndIsDeletedFalse(ticketId);
        List<AttachmentResponseDTO> responseDTOs = new ArrayList<>();
        
        for (AttachmentModel attachment : attachments) {
            responseDTOs.add(convertToResponseDTO(attachment));
        }
        
        return responseDTOs;
    }
    
    public AttachmentResponseDTO getAttachment(String attachmentId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
            .orElseThrow(() -> new RuntimeException("Attachment not found with ID: " + attachmentId));
        
        return convertToResponseDTO(attachment);
    }
    
    public String getBase64Content(String attachmentId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
            .orElseThrow(() -> new RuntimeException("Attachment not found with ID: " + attachmentId));
        
        // Add data URL prefix for browser display
        String mimeType = attachment.getFileType();
        return "data:" + mimeType + ";base64," + attachment.getBase64Content();
    }
    
    public long getAttachmentCountByTicket(String ticketId) {
        return attachmentRepository.countActiveByTicketId(ticketId);
    }
    
    private void validateFile(MultipartFile file) {
        // Check file not empty
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty. Please select a file to upload.");
        }
        
        // Check file size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                String.format("File size exceeds %d MB limit. Your file is %.2f MB", 
                    MAX_FILE_SIZE / (1024 * 1024), 
                    file.getSize() / (1024.0 * 1024.0)));
        }
        
        // Check file type (only images)
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are allowed. Supported: JPG, PNG, GIF, etc.");
        }
        
        // Check file extension
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null && originalFilename.contains(".")) {
            String extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
            if (!extension.matches("jpg|jpeg|png|gif|webp|bmp")) {
                throw new IllegalArgumentException(
                    "Invalid file type. Allowed extensions: JPG, JPEG, PNG, GIF, WEBP, BMP");
            }
        }
    }
    
    private AttachmentResponseDTO convertToResponseDTO(Attachment attachment) {
        AttachmentResponseDTO dto = new AttachmentResponseDTO();
        dto.setId(attachment.getId());
        dto.setTicketId(attachment.getTicketId());
        dto.setFileName(attachment.getFileName());
        dto.setOriginalFileName(attachment.getOriginalFileName());
        dto.setFileType(attachment.getFileType());
        dto.setFileSize(attachment.getFileSize());
        dto.setUploadedBy(attachment.getUploadedBy());
        dto.setUploadedByName(attachment.getUploadedByName());
        dto.setUploadedAt(attachment.getUploadedAt());
        
        // Return Base64 with data URL prefix for easy display
        if (attachment.getBase64Content() != null && !attachment.isDeleted()) {
            dto.setBase64Content("data:" + attachment.getFileType() + ";base64," + attachment.getBase64Content());
        }
        
        return dto;
    }
}