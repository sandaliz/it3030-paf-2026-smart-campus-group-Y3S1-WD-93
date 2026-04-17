package com.sliit.uniops.controller.ticket;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.sliit.uniops.dto.request.ticket.CommentRequestDTO;
import com.sliit.uniops.service.ticket.TicketCommentService;
import com.sliit.uniops.dto.response.ticket.CommentResponseDTO;
import com.sliit.uniops.dto.request.ticket.CommentUpdateDTO;
import org.springframework.web.bind.annotation.*;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/tickets/{ticketId}/comments")
@RequiredArgsConstructor

public class CommentController {
    
    private final TicketCommentService commentService;
    
    @PostMapping
    public ResponseEntity<CommentResponseDTO> addComment(
            @PathVariable String ticketId,
            @Valid @RequestBody CommentRequestDTO request,
            @AuthenticationPrincipal OidcUser user) {
        
        String userId = user.getSubject();
        String userName = user.getFullName();
        String userRole = extractUserRole(user);
        
        CommentResponseDTO comment = commentService.addComment(ticketId, request, userId, userName, userRole);
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }
    
    @GetMapping
    public ResponseEntity<List<CommentResponseDTO>> getComments(
            @PathVariable String ticketId,
            @AuthenticationPrincipal OidcUser user) {
        
        String userId = user.getSubject();
        String userRole = extractUserRole(user);
        
        List<CommentResponseDTO> comments = commentService.getCommentsByTicket(ticketId, userRole, userId);
        return ResponseEntity.ok(comments);
    }
    
    @GetMapping("/public")
    public ResponseEntity<List<CommentResponseDTO>> getPublicComments(@PathVariable String ticketId) {
        List<CommentResponseDTO> comments = commentService.getPublicComments(ticketId);
        return ResponseEntity.ok(comments);
    }
    
    @PutMapping("/{commentId}")
    public ResponseEntity<CommentResponseDTO> updateComment(
            @PathVariable String ticketId,
            @PathVariable String commentId,
            @Valid @RequestBody CommentUpdateDTO request,
            @AuthenticationPrincipal OidcUser user) {
        
        String userId = user.getSubject();
        String userRole = extractUserRole(user);
        
        CommentResponseDTO comment = commentService.updateComment(commentId, request, userId, userRole);
        return ResponseEntity.ok(comment);
    }
    
    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable String ticketId,
            @PathVariable String commentId,
            @AuthenticationPrincipal OidcUser user) {
        
        String userId = user.getSubject();
        String userRole = extractUserRole(user);
        
        commentService.deleteComment(commentId, userId, userRole);
        return ResponseEntity.noContent().build();
    }
    
    @DeleteMapping("/{commentId}/permanent")
    public ResponseEntity<Void> hardDeleteComment(
            @PathVariable String ticketId,
            @PathVariable String commentId,
            @AuthenticationPrincipal OidcUser user) {
        
        String userRole = extractUserRole(user);
        
        commentService.hardDeleteComment(commentId, userRole);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/count")
    public ResponseEntity<Long> getCommentCount(@PathVariable String ticketId) {
        long count = commentService.getCommentCount(ticketId);
        return ResponseEntity.ok(count);
    }
    
    @GetMapping("/count/internal")
    public ResponseEntity<Long> getInternalCommentCount(@PathVariable String ticketId) {
        long count = commentService.getInternalCommentCount(ticketId);
        return ResponseEntity.ok(count);
    }
    
    private String extractUserRole(OidcUser user) {
        // Extract role from authorities or custom attribute
        if (user.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return "ADMIN";
        }
        if (user.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_TECHNICIAN"))) {
            return "TECHNICIAN";
        }
        return "USER";
    }
}