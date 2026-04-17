package com.sliit.uniops.controller.ticket;

import com.sliit.uniops.dto.request.ticket.AttachmentRequestDTO;
import com.sliit.uniops.dto.response.ticket.AttachmentResponseDTO;
import com.sliit.uniops.service.ticket.AttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/attachments")
@RequiredArgsConstructor
public class AttachmentController {
    
    private final AttachmentService attachmentService;
    
    // Upload using MultipartFile (converted to Base64 internally)
    @PostMapping("/upload/{ticketId}")
    public ResponseEntity<AttachmentResponseDTO> uploadAttachment(
            @PathVariable String ticketId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal OidcUser user) {
        
        String userId = user.getSubject();
        String userName = user.getFullName();
        
        AttachmentResponseDTO attachment = attachmentService.uploadAttachment(file, ticketId, userId, userName);
        return ResponseEntity.status(HttpStatus.CREATED).body(attachment);
    }
    
    // Upload using Base64 string (for frontend)
    @PostMapping("/upload-base64/{ticketId}")
    public ResponseEntity<AttachmentResponseDTO> uploadBase64Attachment(
            @PathVariable String ticketId,
            @RequestBody AttachmentRequestDTO request,
            @AuthenticationPrincipal OidcUser user) {
        
        String userId = user.getSubject();
        String userName = user.getFullName();
        
        AttachmentResponseDTO attachment = attachmentService.uploadBase64Attachment(request, ticketId, userId, userName);
        return ResponseEntity.status(HttpStatus.CREATED).body(attachment);
    }
    
    @GetMapping("/ticket/{ticketId}")
    public ResponseEntity<List<AttachmentResponseDTO>> getAttachmentsByTicket(@PathVariable String ticketId) {
        List<AttachmentResponseDTO> attachments = attachmentService.getAttachmentsByTicket(ticketId);
        return ResponseEntity.ok(attachments);
    }
    
    @GetMapping("/{attachmentId}")
    public ResponseEntity<AttachmentResponseDTO> getAttachment(@PathVariable String attachmentId) {
        AttachmentResponseDTO attachment = attachmentService.getAttachment(attachmentId);
        return ResponseEntity.ok(attachment);
    }
    
    @GetMapping("/content/{attachmentId}")
    public ResponseEntity<String> getBase64Content(@PathVariable String attachmentId) {
        String base64Content = attachmentService.getBase64Content(attachmentId);
        return ResponseEntity.ok(base64Content);
    }
    
    @DeleteMapping("/{attachmentId}")
    public ResponseEntity<Void> deleteAttachment(
            @PathVariable String attachmentId,
            @AuthenticationPrincipal OidcUser user) {
        
        String userId = user.getSubject();
        boolean isAdmin = user.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        
        attachmentService.deleteAttachment(attachmentId, userId, isAdmin);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/count/{ticketId}")
    public ResponseEntity<Long> getAttachmentCount(@PathVariable String ticketId) {
        long count = attachmentService.getAttachmentCountByTicket(ticketId);
        return ResponseEntity.ok(count);
    }
}