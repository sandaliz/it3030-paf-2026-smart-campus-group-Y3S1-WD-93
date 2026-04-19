package com.sliit.uniops.service.ticket;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sliit.uniops.dto.request.ticket.CommentRequestDTO;
import com.sliit.uniops.dto.request.ticket.CommentUpdateDTO;
import com.sliit.uniops.dto.response.ticket.CommentResponseDTO;
import com.sliit.uniops.model.ticket.CommentModel;
import com.sliit.uniops.model.ticket.TicketModel;
import com.sliit.uniops.repository.ticket.CommentRepository;
import com.sliit.uniops.repository.ticket.TicketRepository;
import com.sliit.uniops.util.enums.TicketStatus;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketCommentService {

    private final CommentRepository commentRepository;
    private final TicketRepository ticketRepository;
    private final TicketNotificationService notificationService;

    private static final int EDIT_TIME_LIMIT_MINUTES = 30;  // Can edit within 30 minutes
    
    @Transactional
    public CommentResponseDTO addComment(String ticketId, CommentRequestDTO request, 
                                         String userId, String userName, String userRole) {
        log.info("Adding comment to ticket: {} by user: {}", ticketId, userId);
        
        // Verify ticket exists
        TicketModel ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new RuntimeException("Ticket not found with ID: " + ticketId));
        
        // Check permission for internal comments
        if (request.isInternal()) {
            boolean canAddInternal = userRole.equals("ADMIN") || 
                                    userRole.equals("TECHNICIAN") ||
                                    isAssignedTechnician(ticket, userId);
            
            if (!canAddInternal) {
                throw new SecurityException("Only admins, technicians, or assigned technician can add internal notes");
            }
        }
        
        // Create comment (FIXED: removed userRole parameter)
        CommentModel comment = new CommentModel(
            ticketId, userId, userName, request.getContent(), request.isInternal()
        );
        
        CommentModel savedComment = commentRepository.save(comment);
        log.info("Comment added with ID: {}", savedComment.getId());
        
        // Send notification (only for public comments)
        if (!request.isInternal()) {
            notificationService.notifyNewComment(ticket, savedComment, userName);
        }
        
        // Auto-transition to PENDING_CONFIRMATION if needed
        if (!request.isInternal() && TicketStatus.RESOLVED.equals(ticket.getStatus())) {
            // When user adds a comment to a resolved ticket, move back to IN_PROGRESS
            ticket.setStatus(TicketStatus.IN_PROGRESS);
            ticket.setUpdatedAt(LocalDateTime.now());
            ticketRepository.save(ticket);
            log.info("Ticket {} moved back to IN_PROGRESS due to new comment", ticketId);
        }
        
        return convertToResponseDTO(savedComment);
    }
    
    public List<CommentResponseDTO> getCommentsByTicket(String ticketId, String userRole, String userId) {
        TicketModel ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new RuntimeException("Ticket not found with ID: " + ticketId));
        
        boolean canViewInternal = userRole.equals("ADMIN") || 
                                  userRole.equals("TECHNICIAN") ||
                                  isAssignedTechnician(ticket, userId);
        
        List<CommentModel> comments;
        
        if (canViewInternal) {
            // Admins/technicians/assigned tech can see all comments
            comments = commentRepository.findByTicketId(ticketId);
        } else {
            // Regular users see only public comments
            comments = commentRepository.findPublicCommentsByTicketId(ticketId);
        }
        
        // Filter out deleted comments for non-admins
        List<CommentResponseDTO> responseDTOs = new ArrayList<>();
        for (CommentModel comment : comments) {
            if (!comment.isDeleted() || userRole.equals("ADMIN")) {
                responseDTOs.add(convertToResponseDTO(comment));
            }
        }
        
        return responseDTOs;
    }
    
    public List<CommentResponseDTO> getPublicComments(String ticketId) {
        List<CommentModel> comments = commentRepository.findPublicCommentsByTicketId(ticketId);
        List<CommentResponseDTO> responseDTOs = new ArrayList<>();
        
        for (CommentModel comment : comments) {
            if (!comment.isDeleted()) {
                responseDTOs.add(convertToResponseDTO(comment));
            }
        }
        
        return responseDTOs;
    }
    
    @Transactional
    public CommentResponseDTO updateComment(String commentId, CommentUpdateDTO request, 
                                            String userId, String userRole) {
        log.info("Updating comment: {} by user: {}", commentId, userId);
        
        CommentModel comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new RuntimeException("Comment not found with ID: " + commentId));
        
        // Check ownership or admin role
        boolean isOwner = comment.getAuthorId().equals(userId);
        boolean isAdmin = userRole.equals("ADMIN");
        
        if (!isOwner && !isAdmin) {
            throw new SecurityException("You can only edit your own comments");
        }
        
        // Check edit time limit (30 minutes for regular users, no limit for admins)
        if (!isAdmin) {
            LocalDateTime editDeadline = comment.getCreatedAt().plusMinutes(EDIT_TIME_LIMIT_MINUTES);
            if (LocalDateTime.now().isAfter(editDeadline)) {
                throw new IllegalStateException(
                    String.format("Comments can only be edited within %d minutes of creation", 
                        EDIT_TIME_LIMIT_MINUTES));
            }
        }
        
        // Update content
        comment.updateContent(request.getContent());
        CommentModel updatedComment = commentRepository.save(comment);
        
        log.info("Comment updated: {}", commentId);
        
        return convertToResponseDTO(updatedComment);
    }
    
    @Transactional
    public void deleteComment(String commentId, String userId, String userRole) {
        log.info("Deleting comment: {} by user: {}", commentId, userId);
        
        CommentModel comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new RuntimeException("Comment not found with ID: " + commentId));
        
        // Check ownership or admin role
        boolean isOwner = comment.getAuthorId().equals(userId);
        boolean isAdmin = userRole.equals("ADMIN");
        
        if (!isOwner && !isAdmin) {
            throw new SecurityException("You can only delete your own comments");
        }
        
        // Soft delete (keep record but hide content)
        comment.softDelete();
        commentRepository.save(comment);
        
        log.info("Comment deleted: {}", commentId);
    }
    
    @Transactional
    public void hardDeleteComment(String commentId, String userRole) {
        // Admin only - permanent deletion
        if (!userRole.equals("ADMIN")) {
            throw new SecurityException("Only admins can permanently delete comments");
        }
        
        commentRepository.deleteById(commentId);
        log.info("Comment permanently deleted: {}", commentId);
    }
    
    public long getCommentCount(String ticketId) {
        return commentRepository.countByTicketIdAndIsDeletedFalse(ticketId);
    }
    
    public long getInternalCommentCount(String ticketId) {
        return commentRepository.countByTicketIdAndIsInternalTrueAndIsDeletedFalse(ticketId);
    }

    private boolean isAssignedTechnician(TicketModel ticket, String userId) {
        if (userId == null || userId.isBlank()) {
            return false;
        }

        if (ticket.getAssignedTechnicianIds() != null && ticket.getAssignedTechnicianIds().contains(userId)) {
            return true;
        }

        return ticket.getAssignedTo() != null && ticket.getAssignedTo().equals(userId);
    }
    
    private CommentResponseDTO convertToResponseDTO(CommentModel comment) {
        CommentResponseDTO dto = new CommentResponseDTO();
        dto.setId(comment.getId());
        dto.setTicketId(comment.getTicketId());
        dto.setAuthorId(comment.getAuthorId());
        dto.setAuthorName(comment.getAuthorName());
        dto.setContent(comment.getContent());
        dto.setInternal(comment.isInternal());
        dto.setCreatedAt(comment.getCreatedAt());
        dto.setUpdatedAt(comment.getUpdatedAt());
        dto.setEdited(comment.isEdited());
        dto.setDeleted(comment.isDeleted());
        return dto;
    }
}
