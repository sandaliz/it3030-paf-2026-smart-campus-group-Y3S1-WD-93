package com.sliit.uniops.service.ticket;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.sliit.uniops.model.ticket.TicketModel;
import com.sliit.uniops.repository.ticket.TicketRepository;
import com.sliit.uniops.repository.ticket.CommentRepository;
import com.sliit.uniops.dto.request.ticket.TicketRequestDTO;
import com.sliit.uniops.dto.response.ticket.TicketResponseDTO;
import com.sliit.uniops.exception.ticket.InvalidTicketStatusException;
import com.sliit.uniops.exception.ticket.TicketNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.sliit.uniops.service.ticket.TicketNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.sliit.uniops.util.enums.TicketCategory;
import com.sliit.uniops.util.enums.TicketPriority;
import com.sliit.uniops.util.enums.TicketStatus;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {

    private final TicketRepository ticketRepository;
    private final CommentRepository commentRepository;
    private final AttachmentService attachmentService;
    private final TicketNotificationService notificationService;

    // ✅ CREATE TICKET
    @Transactional
    public TicketResponseDTO createTicket(TicketRequestDTO request, String userId, String userName) {

        log.info("Creating ticket for user: {}", userId);

        if (!isValidCategory(request.getCategory())) {
            throw new IllegalArgumentException("Invalid category");
        }

        if (!isValidPriority(request.getPriority())) {
            throw new IllegalArgumentException("Invalid priority");
        }

        if (request.getAttachments() != null && request.getAttachments().size() > 3) {
            throw new IllegalArgumentException("Max 3 attachments allowed");
        }

        TicketModel ticket = new TicketModel();
        ticket.setTitle(request.getTitle());
        ticket.setDescription(request.getDescription());
        ticket.setCategory(TicketCategory.valueOf(request.getCategory()));
        ticket.setPriority(TicketPriority.valueOf(request.getPriority()));
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setLocation(request.getLocation());
        ticket.setResourceId(request.getResourceId());
        ticket.setCreatedBy(userId);
        ticket.setAttachmentIds(new ArrayList<>());
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setUpdatedAt(LocalDateTime.now());

        // Save first (needed to get ID)
        TicketModel savedTicket = ticketRepository.save(ticket);

        // ✅ Handle attachments
        String ticketId = savedTicket.getId();

        if (request.getAttachments() != null && !request.getAttachments().isEmpty()) {
            try {
                List<String> attachmentIds = new ArrayList<>();

                for (var file : request.getAttachments()) {
                    try {
                        String id = attachmentService.uploadAttachment(file, ticketId, userId, userName).getId();
                        attachmentIds.add(id);
                    } catch (Exception e) {
                        log.error("Individual file upload failed", e);
                        throw new RuntimeException("File upload failed: " + e.getMessage());
                    }
                }

                savedTicket.setAttachmentIds(attachmentIds);
                savedTicket = ticketRepository.save(savedTicket);

            } catch (Exception e) {
                log.error("Attachment upload failed", e);
                // Continue without attachments - don't fail ticket creation
            }
        }

        // ✅ Send notification
        notificationService.notifyTicketCreated(savedTicket, userName);

        return mapToResponseDTO(savedTicket);
    }

    // ✅ GET BY ID
    public TicketResponseDTO getTicketById(String id) {
        TicketModel ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found"));

        return mapToResponseDTO(ticket);
    }

    // ✅ GET USER TICKETS
    public Page<TicketResponseDTO> getTicketsByUser(String userId, Pageable pageable) {
        return ticketRepository.findByCreatedBy(userId, pageable)
                .map(this::mapToResponseDTO);
    }

    // ✅ GET TECHNICIAN TICKETS
    public Page<TicketResponseDTO> getTicketsByTechnician(String technicianId, Pageable pageable) {
        return ticketRepository.findByAssignedTo(technicianId, pageable)
                .map(this::mapToResponseDTO);
    }

    // ✅ GET ALL
    public Page<TicketResponseDTO> getAllTickets(Pageable pageable) {
        return ticketRepository.findAll(pageable)
                .map(this::mapToResponseDTO);
    }

    // ✅ UPDATE STATUS
    @Transactional
    public TicketResponseDTO updateTicketStatus(String ticketId, String newStatus, String reason, String userId, String userRole) {

        TicketModel ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found"));

        if (!isValidStatus(newStatus)) {
            throw new IllegalArgumentException("Invalid status");
        }

        TicketStatus newStatusEnum = TicketStatus.valueOf(newStatus);
        
        if (!ticket.getStatus().canTransitionTo(newStatusEnum)) {
            throw new InvalidTicketStatusException(
                String.format("Cannot transition from %s to %s", 
                    ticket.getStatus().name(), newStatus));
        }

        TicketStatus oldStatusEnum = ticket.getStatus();
        ticket.setStatus(newStatusEnum);
        ticket.setUpdatedAt(LocalDateTime.now());

        if (TicketStatus.IN_PROGRESS.equals(newStatusEnum) && ticket.getFirstResponseAt() == null) {
            ticket.setFirstResponseAt(LocalDateTime.now());
        }

        if (TicketStatus.RESOLVED.equals(newStatusEnum)) {
            ticket.setResolvedAt(LocalDateTime.now());
            ticket.setResolutionNotes(reason);
        }

        if (TicketStatus.REJECTED.equals(newStatusEnum)) {
            ticket.setRejectionReason(reason);
        }

        if (TicketStatus.CLOSED.equals(newStatusEnum)) {
            ticket.setClosedAt(LocalDateTime.now());
        }

        TicketModel updated = ticketRepository.save(ticket);

        notificationService.notifyTicketStatusChanged(updated, oldStatusEnum.name(), newStatus, userId);

        return mapToResponseDTO(updated);
    }

    // ✅ ASSIGN TECHNICIAN
    @Transactional
    public TicketResponseDTO assignTechnician(String ticketId, String technicianId, String assignedBy) {

        TicketModel ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found"));

        ticket.setAssignedTo(technicianId);
        ticket.setUpdatedAt(LocalDateTime.now());

        if (TicketStatus.OPEN.equals(ticket.getStatus())) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }

        TicketModel updated = ticketRepository.save(ticket);
        
        notificationService.notifyTicketAssigned(updated, technicianId, assignedBy);

        return mapToResponseDTO(updated);
    }

    // ✅ USER CONFIRMATION - Updated for PENDING_CONFIRMATION status
@Transactional
public TicketResponseDTO confirmTicketResolution(String ticketId, String userId, String feedback) {
    log.info("User {} confirming ticket resolution: {}", userId, ticketId);
    
    TicketModel ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new TicketNotFoundException("Ticket not found"));
    
    // Verify user is the ticket creator
    if (!ticket.getCreatedBy().equals(userId)) {
        throw new AccessDeniedException("Only ticket creator can confirm resolution");
    }
    
    // Verify ticket is in RESOLVED or PENDING_CONFIRMATION status
    if (!TicketStatus.RESOLVED.equals(ticket.getStatus()) && 
        !TicketStatus.PENDING_CONFIRMATION.equals(ticket.getStatus())) {
        throw new InvalidTicketStatusException("Ticket must be resolved before confirmation");
    }
    
    // Move to CLOSED status
    ticket.setStatus(TicketStatus.CLOSED);
    ticket.setClosedAt(LocalDateTime.now());
    ticket.setUpdatedAt(LocalDateTime.now());
    
    // Store feedback if provided
    if (feedback != null && !feedback.isEmpty()) {
        ticket.setResolutionNotes(feedback);
    }
    
    TicketModel updated = ticketRepository.save(ticket);
    
    // Send notification to admin and technician
    notificationService.notifyTicketConfirmedByUser(updated, userId, feedback);
    
    return mapToResponseDTO(updated);
}

// ✅ Additional method for moving to PENDING_CONFIRMATION
@Transactional
public TicketResponseDTO moveToPendingConfirmation(String ticketId, String userId, String userRole) {
    log.info("Moving ticket {} to PENDING_CONFIRMATION by user: {}", ticketId, userId);
    
    TicketModel ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new TicketNotFoundException("Ticket not found"));
    
    // Only admins or assigned technician can do this
    boolean isAuthorized = userRole.equals("ADMIN") || 
                          (ticket.getAssignedTo() != null && ticket.getAssignedTo().equals(userId));
    
    if (!isAuthorized) {
        throw new AccessDeniedException("Only admins or assigned technician can move ticket to pending confirmation");
    }
    
    // Verify current status is RESOLVED
    if (!TicketStatus.RESOLVED.equals(ticket.getStatus())) {
        throw new InvalidTicketStatusException("Ticket must be resolved before moving to pending confirmation");
    }
    
    ticket.setStatus(TicketStatus.PENDING_CONFIRMATION);
    ticket.setUpdatedAt(LocalDateTime.now());
    
    TicketModel updated = ticketRepository.save(ticket);
    
    // Notify user that confirmation is needed
    String message = String.format(
        "Ticket #%s has been resolved and is pending your confirmation. Please review and confirm if the issue is fixed.",
        ticket.getId()
    );
    notificationService.storeNotification(ticket.getCreatedBy(), "PENDING_CONFIRMATION", message, ticket.getId());
    
    return mapToResponseDTO(updated);
}

    // ✅ SEARCH
    public List<TicketResponseDTO> searchTickets(String keyword) {
        return ticketRepository.searchByKeyword(keyword)
                .stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    // ✅ VALIDATION METHODS
    private boolean isValidStatus(String status) {
        return isValidEnum(status, TicketStatus.class);
    }
    
    private boolean isValidCategory(String category) {
        return isValidEnum(category, TicketCategory.class);
    }
    
    private boolean isValidPriority(String priority) {
        return isValidEnum(priority, TicketPriority.class);
    }

    // ✅ ENUM VALIDATION HELPER
    private boolean isValidEnum(String value, Class<? extends Enum<?>> enumClass) {
        if (value == null) return false;
        try {
            for (Object enumConstant : enumClass.getEnumConstants()) {
                if (enumConstant.toString().equals(value)) {
                    return true;
                }
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    // ✅ MAPPER
    private TicketResponseDTO mapToResponseDTO(TicketModel ticket) {
        long commentCount = commentRepository.countByTicketIdAndIsDeletedFalse(ticket.getId());

        TicketResponseDTO dto = new TicketResponseDTO();
        dto.setId(ticket.getId());
        dto.setTitle(ticket.getTitle());
        dto.setDescription(ticket.getDescription());
        dto.setCategory(ticket.getCategory());
        dto.setPriority(ticket.getPriority());
        dto.setStatus(ticket.getStatus());
        dto.setLocation(ticket.getLocation());
        dto.setResourceId(ticket.getResourceId());
        dto.setCreatedBy(ticket.getCreatedBy());
        dto.setAssignedTo(ticket.getAssignedTo());
        dto.setAttachmentUrls(ticket.getAttachmentIds());
        dto.setResolutionNotes(ticket.getResolutionNotes());
        dto.setRejectionReason(ticket.getRejectionReason());
        dto.setCreatedAt(ticket.getCreatedAt());
        dto.setUpdatedAt(ticket.getUpdatedAt());
        dto.setResolvedAt(ticket.getResolvedAt());
        dto.setClosedAt(ticket.getClosedAt());
        dto.setFirstResponseAt(ticket.getFirstResponseAt());
        dto.setCommentCount(commentCount);
        
        return dto;
    }
}
