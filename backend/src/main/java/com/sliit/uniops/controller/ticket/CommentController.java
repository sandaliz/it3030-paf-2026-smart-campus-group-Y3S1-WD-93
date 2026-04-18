package com.sliit.uniops.controller.ticket;

import java.util.List;

import com.sliit.uniops.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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
            Authentication authentication) {
        
        String userId = getUserId(authentication);
        String userName = getUserName(authentication);
        String userRole = extractUserRole(authentication);
        
        CommentResponseDTO comment = commentService.addComment(ticketId, request, userId, userName, userRole);
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }
    
    @GetMapping
    public ResponseEntity<List<CommentResponseDTO>> getComments(
            @PathVariable String ticketId,
            Authentication authentication) {
        
        String userId = getUserId(authentication);
        String userRole = extractUserRole(authentication);
        
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
            Authentication authentication) {
        
        String userId = getUserId(authentication);
        String userRole = extractUserRole(authentication);
        
        CommentResponseDTO comment = commentService.updateComment(commentId, request, userId, userRole);
        return ResponseEntity.ok(comment);
    }
    
    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable String ticketId,
            @PathVariable String commentId,
            Authentication authentication) {
        
        String userId = getUserId(authentication);
        String userRole = extractUserRole(authentication);
        
        commentService.deleteComment(commentId, userId, userRole);
        return ResponseEntity.noContent().build();
    }
    
    @DeleteMapping("/{commentId}/permanent")
    public ResponseEntity<Void> hardDeleteComment(
            @PathVariable String ticketId,
            @PathVariable String commentId,
            Authentication authentication) {
        
        String userRole = extractUserRole(authentication);
        
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
    
    private String extractUserRole(Authentication authentication) {
        if (authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return "ADMIN";
        }
        if (authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_TECHNICIAN"))) {
            return "TECHNICIAN";
        }
        return "USER";
    }

    private String getUserId(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserPrincipal user) {
            return user.getId();
        }
        return authentication.getName();
    }

    private String getUserName(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserPrincipal user) {
            return user.getName() != null ? user.getName() : user.getEmail();
        }
        return authentication.getName();
    }
}
