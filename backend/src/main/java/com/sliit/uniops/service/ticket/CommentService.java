package com.sliit.uniops.service.ticket;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sliit.uniops.dto.request.ticket.CommentRequestDTO;
import com.sliit.uniops.dto.response.ticket.CommentResponseDTO;
import com.sliit.uniops.exception.ticket.CommentNotFoundException;
import com.sliit.uniops.exception.ticket.TicketNotFoundException;
import com.sliit.uniops.exception.ticket.UnauthorizedActionException;
import com.sliit.uniops.model.ticket.CommentModel;
import com.sliit.uniops.model.ticket.TicketModel;
import com.sliit.uniops.repository.ticket.CommentRepository;
import com.sliit.uniops.repository.ticket.TicketRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentService {

    private final CommentRepository commentRepository;
    private final TicketRepository ticketRepository;
    private final TicketNotificationService notificationService;

    @Transactional
    public CommentResponseDTO addComment(String ticketId, CommentRequestDTO request, 
                                         String userId, String userName) {
        // Verify ticket exists
        TicketModel ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new TicketNotFoundException("Ticket not found"));

        // Create comment using NoArgsConstructor + Setters
        CommentModel comment = new CommentModel();
        comment.setTicketId(ticketId);
        comment.setAuthorId(userId);
        comment.setAuthorName(userName);
        comment.setContent(request.getContent());
        comment.setCreatedAt(LocalDateTime.now());
        comment.setEdited(false);
        comment.setDeleted(false);

        CommentModel savedComment = commentRepository.save(comment);

        // Send notification
        notificationService.notifyNewComment(ticket, savedComment, userName);

        // Create response DTO without builder
        CommentResponseDTO response = new CommentResponseDTO();
        response.setId(savedComment.getId());
        response.setTicketId(savedComment.getTicketId());
        response.setAuthorId(savedComment.getAuthorId());
        response.setAuthorName(savedComment.getAuthorName());
        response.setContent(savedComment.getContent());
        response.setCreatedAt(savedComment.getCreatedAt());
        response.setUpdatedAt(savedComment.getUpdatedAt());
        response.setEdited(savedComment.isEdited());

        return response;
    }

    public List<CommentResponseDTO> getCommentsByTicket(String ticketId) {
        // Verify ticket exists
        if (!ticketRepository.existsById(ticketId)) {
            throw new TicketNotFoundException("Ticket not found");
        }

        return commentRepository.findByTicketId(ticketId).stream()
            .filter(comment -> !comment.isDeleted())
            .map(this::mapToResponseDTO)
            .collect(Collectors.toList());
    }



    @Transactional
    public CommentResponseDTO updateComment(String commentId, String content, 
                                            String userId, boolean isAdmin) {
        CommentModel comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new CommentNotFoundException("Comment not found"));

        // Check ownership or admin role
        if (!comment.getAuthorId().equals(userId) && !isAdmin) {
            throw new UnauthorizedActionException("You can only edit your own comments");
        }

        // Check if comment is too old to edit (30 minutes window)
        if (comment.getCreatedAt().isBefore(LocalDateTime.now().minusMinutes(30)) && !isAdmin) {
            throw new UnauthorizedActionException("Comments can only be edited within 30 minutes");
        }

        comment.updateContent(content);
        CommentModel updatedComment = commentRepository.save(comment);

        return mapToResponseDTO(updatedComment);
    }

    @Transactional
    public void deleteComment(String commentId, String userId, boolean isAdmin) {
        CommentModel comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new CommentNotFoundException("Comment not found"));

        // Check ownership or admin role
        if (!comment.getAuthorId().equals(userId) && !isAdmin) {
            throw new UnauthorizedActionException("You can only delete your own comments");
        }

        comment.setDeleted(true);
        commentRepository.save(comment);
    }

    private CommentResponseDTO mapToResponseDTO(CommentModel comment) {
        // Create response DTO without builder
        CommentResponseDTO response = new CommentResponseDTO();
        response.setId(comment.getId());
        response.setTicketId(comment.getTicketId());
        response.setAuthorId(comment.getAuthorId());
        response.setAuthorName(comment.getAuthorName());
        response.setContent(comment.getContent());
        response.setCreatedAt(comment.getCreatedAt());
        response.setUpdatedAt(comment.getUpdatedAt());
        response.setEdited(comment.isEdited());

        return response;
    }
}