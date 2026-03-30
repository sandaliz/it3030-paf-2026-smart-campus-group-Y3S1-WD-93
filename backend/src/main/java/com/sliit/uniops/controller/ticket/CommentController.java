package com.sliit.uniops.controller.ticket;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.sliit.uniops.dto.request.ticket.CommentRequestDTO;
import com.sliit.uniops.service.ticket.CommentService;
import com.sliit.uniops.dto.response.ticket.CommentResponseDTO;
import org.springframework.web.bind.annotation.*;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/tickets/{ticketId}/comments")
@RequiredArgsConstructor
public class CommentController {
    private final CommentService commentService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CommentResponseDTO> addComment(
            @PathVariable String ticketId,
            @Valid @RequestBody CommentRequestDTO request,
            @AuthenticationPrincipal OidcUser user) {

        String userId = user.getSubject();
        String userName = user.getFullName();

        CommentResponseDTO comment = commentService.addComment(ticketId, request, userId, userName);
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CommentResponseDTO>> getComments(@PathVariable String ticketId) {
        List<CommentResponseDTO> comments = commentService.getCommentsByTicket(ticketId);
        return ResponseEntity.ok(comments);
    }


    @PutMapping("/{commentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CommentResponseDTO> updateComment(
            @PathVariable String ticketId,
            @PathVariable String commentId,
            @RequestParam String content,
            @AuthenticationPrincipal OidcUser user) {

        String userId = user.getSubject();
        boolean isAdmin = user.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        CommentResponseDTO comment = commentService.updateComment(commentId, content, userId, isAdmin);
        return ResponseEntity.ok(comment);
    }

    @DeleteMapping("/{commentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteComment(
            @PathVariable String ticketId,
            @PathVariable String commentId,
            @AuthenticationPrincipal OidcUser user) {

        String userId = user.getSubject();
        boolean isAdmin = user.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        commentService.deleteComment(commentId, userId, isAdmin);
        return ResponseEntity.noContent().build();
    }
}