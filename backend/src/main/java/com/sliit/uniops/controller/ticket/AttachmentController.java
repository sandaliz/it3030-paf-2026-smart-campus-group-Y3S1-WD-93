package com.sliit.uniops.controller.ticket;

import com.sliit.uniops.model.ticket.AttachmentModel;
import com.sliit.uniops.service.ticket.AttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/attachments")
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService attachmentService;

    @GetMapping("/ticket/{ticketId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AttachmentModel>> getAttachmentsByTicket(@PathVariable String ticketId) {
        List<AttachmentModel> attachments = attachmentService.getAttachmentsByTicket(ticketId);
        return ResponseEntity.ok(attachments);
    }

    @GetMapping("/{attachmentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> downloadAttachment(@PathVariable String attachmentId) throws IOException {
        AttachmentModel attachment = attachmentService.getAttachment(attachmentId);
        byte[] fileContent = attachmentService.downloadAttachment(attachmentId);

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(attachment.getFileType()))
            .header(HttpHeaders.CONTENT_DISPOSITION, 
                    "inline; filename=\"" + attachment.getFileName() + "\"")
            .body(fileContent);
    }

    @DeleteMapping("/{attachmentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAttachment(@PathVariable String attachmentId) throws IOException {
        attachmentService.deleteAttachment(attachmentId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/ticket/{ticketId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAttachmentsByTicket(@PathVariable String ticketId) throws IOException {
        attachmentService.deleteAttachmentsByTicket(ticketId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/ticket/{ticketId}/count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Long> getAttachmentCount(@PathVariable String ticketId) {
        long count = attachmentService.getAttachmentCount(ticketId);
        return ResponseEntity.ok(count);
    }
}
