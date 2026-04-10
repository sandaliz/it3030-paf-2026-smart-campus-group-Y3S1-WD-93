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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final NotificationService notificationService;

    // ✅ CREATE TICKET
    @Transactional
    public TicketResponseDTO createTicket(TicketRequestDTO request, String userId) {

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
        String ticketId = savedTicket.getId(); // ✅ now effectively final

        if (request.getAttachments() != null && !request.getAttachments().isEmpty()) {
            try {
                List<String> attachmentIds = new ArrayList<>();

                request.getAttachments().forEach(file -> {
                    try {
                        String id = attachmentService.uploadAttachment(file, ticketId, userId, "User").getId();
                        attachmentIds.add(id);
                    } catch (Exception e) {
                        throw new RuntimeException("File upload failed");
                    }
                });

                savedTicket.setAttachmentIds(attachmentIds);
                savedTicket = ticketRepository.save(savedTicket);

            } catch (Exception e) {
                log.error("Attachment upload failed", e);
            }
        }

        // ✅ Send notification
        notificationService.notifyTicketCreated(savedTicket, userId);

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
    public TicketResponseDTO updateTicketStatus(String ticketId, String newStatus, String reason) {

        TicketModel ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found"));

        if (!isValidStatus(newStatus)) {
            throw new IllegalArgumentException("Invalid status");
        }

        TicketStatus newStatusEnum = TicketStatus.valueOf(newStatus);
        
        if (!ticket.getStatus().canTransitionTo(newStatusEnum)) {
            throw new InvalidTicketStatusException("Invalid status transition");
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

        notificationService.notifyTicketStatusChanged(updated, oldStatusEnum.name(), newStatus);

        return mapToResponseDTO(updated);
    }

    // ✅ ASSIGN TECHNICIAN
    @Transactional
    public TicketResponseDTO assignTechnician(String ticketId, String technicianId) {

        TicketModel ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found"));

        ticket.setAssignedTo(technicianId);
        ticket.setUpdatedAt(LocalDateTime.now());

        if (TicketStatus.OPEN.equals(ticket.getStatus())) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }

        TicketModel updated = ticketRepository.save(ticket);

        return mapToResponseDTO(updated);
    }

    // ✅ SEARCH
    public List<TicketResponseDTO> searchTickets(String keyword) {
        return ticketRepository.searchByKeyword(keyword)
                .stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    // ✅ MAPPER
    private TicketResponseDTO mapToResponseDTO(TicketModel ticket) {

        long commentCount = commentRepository.countByTicketId(ticket.getId());

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

        return dto;
    }

    // VALIDATION METHODS
    private boolean isValidCategory(String category) {
        try {
            TicketCategory.valueOf(category);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private boolean isValidPriority(String priority) {
        try {
            TicketPriority.valueOf(priority);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private boolean isValidStatus(String status) {
        try {
            TicketStatus.valueOf(status);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

}