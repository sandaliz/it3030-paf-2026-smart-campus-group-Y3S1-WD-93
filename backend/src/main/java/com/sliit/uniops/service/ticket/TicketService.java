package com.sliit.uniops.service.ticket;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import com.sliit.uniops.model.ticket.TicketModel;
import com.sliit.uniops.repository.ticket.TicketRepository;
import com.sliit.uniops.repository.ticket.CommentRepository;
import com.sliit.uniops.dto.request.ticket.TicketRequestDTO;
import com.sliit.uniops.dto.response.ticket.TechnicianRecommendationDTO;
import com.sliit.uniops.dto.response.ticket.TicketResponseDTO;
import com.sliit.uniops.model.Role;
import com.sliit.uniops.model.Resource;
import com.sliit.uniops.model.User;
import com.sliit.uniops.exception.ticket.InvalidTicketStatusException;
import com.sliit.uniops.exception.ticket.TicketNotFoundException;
import com.sliit.uniops.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sliit.uniops.service.ResourceService;
import com.sliit.uniops.service.ticket.TicketNotificationService;
import com.sliit.uniops.service.EmailService;
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
    private final ResourceService resourceService;
    private final UserRepository userRepository;
    private final EmailService emailService;

    // ✅ CREATE TICKET (FIXED)
    @Transactional
    public TicketResponseDTO createTicket(TicketRequestDTO request, String userId, String userName) {

        log.info("Creating ticket for user: {}", userId);

        // Validate category
        if (!isValidCategory(request.getCategory())) {
            throw new IllegalArgumentException("Invalid category");
        }

        // Validate priority
        if (!isValidPriority(request.getPriority())) {
            throw new IllegalArgumentException("Invalid priority");
        }

        // Validate attachments count
        if (request.getAttachments() != null && request.getAttachments().size() > 3) {
            throw new IllegalArgumentException("Max 3 attachments allowed");
        }
        
        // Validate resource if provided
        if (request.getResourceId() != null && !request.getResourceId().isEmpty()) {
            try {
                Resource resource = resourceService.getResourceById(request.getResourceId());
                if (resource != null) {
                    log.info("Ticket will be created for resource: {} ({})", resource.getName(), resource.getType());
                }
            } catch (Exception e) {
                log.error("Resource not found: {}", request.getResourceId(), e);
                throw new IllegalArgumentException("Invalid resource ID: " + request.getResourceId());
            }
        }

        // Create ticket object (MOVED OUTSIDE try block)
        TicketModel ticket = new TicketModel();
        ticket.setTitle(request.getTitle());
        ticket.setDescription(request.getDescription());
        ticket.setCategory(TicketCategory.valueOf(request.getCategory()));
        ticket.setPriority(TicketPriority.valueOf(request.getPriority()));
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setLocation(request.getLocation());
        ticket.setResourceId(request.getResourceId()); // Can be null
        ticket.setPreferredContactMethod(request.getPreferredContactMethod());
        ticket.setContactDetails(request.getContactDetails());
        ticket.setCreatedBy(userId);
        ticket.setCreatedByName(userName); // Make sure this field exists in TicketModel
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

        // ✅ Send email notification to ticket management admin
        try {
            String resourceName = "";
            if (savedTicket.getResourceId() != null && !savedTicket.getResourceId().isEmpty()) {
                try {
                    Resource resource = resourceService.getResourceById(savedTicket.getResourceId());
                    if (resource != null) {
                        resourceName = resource.getName();
                    }
                } catch (Exception e) {
                    log.warn("Failed to get resource name for ticket notification: {}", e.getMessage());
                }
            }

            emailService.sendTicketManagementNotification(
                savedTicket.getId(),
                savedTicket.getTitle(),
                savedTicket.getDescription(),
                savedTicket.getPriority().toString(),
                savedTicket.getCategory().toString(),
                userName
            );
        } catch (Exception e) {
            // Log error but don't fail ticket creation
            log.error("Failed to send ticket management notification: {}", e.getMessage());
        }

        return mapToResponseDTO(savedTicket);
    }

    // ✅ GET BY ID
    public TicketResponseDTO getTicketById(String id, String userId, String userRole) {
        TicketModel ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found"));

        if (!canAccessTicket(ticket, userId, userRole)) {
            throw new AccessDeniedException("You do not have permission to view this ticket");
        }

        return mapToResponseDTO(ticket);
    }

    // ✅ GET USER TICKETS
    public Page<TicketResponseDTO> getTicketsByUser(String userId, Pageable pageable) {
        return ticketRepository.findByCreatedBy(userId, pageable)
                .map(this::mapToResponseDTO);
    }

    // ✅ GET TECHNICIAN TICKETS
    public Page<TicketResponseDTO> getTicketsByTechnician(String technicianId, Pageable pageable) {
        return ticketRepository.findByAssignedTechnician(technicianId, pageable)
                .map(this::mapToResponseDTO);
    }

    // ✅ GET ALL
    public Page<TicketResponseDTO> getAllTickets(Pageable pageable) {
        return ticketRepository.findAll(pageable)
                .map(this::mapToResponseDTO);
    }

    public List<TechnicianRecommendationDTO> getRecommendedTechnicians(String ticketId) {
        TicketModel ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found"));

        Set<String> desiredSkills = deriveDesiredSkills(ticket);
        Set<String> alreadyAssignedIds = new LinkedHashSet<>(getAssignedTechnicianIds(ticket));

        return userRepository.findAll().stream()
                .filter(this::isActiveTechnician)
                .filter(technician -> alreadyAssignedIds.contains(technician.getId())
                        || !hasActiveAssignmentsForOtherTickets(technician.getId(), ticketId))
                .map(technician -> toTechnicianRecommendation(
                        technician,
                        desiredSkills,
                        alreadyAssignedIds.contains(technician.getId())))
                .sorted(Comparator
                        .comparing(TechnicianRecommendationDTO::isAlreadyAssigned).reversed()
                        .thenComparing(Comparator.comparingInt(TechnicianRecommendationDTO::getMatchScore).reversed())
                        .thenComparingInt(TechnicianRecommendationDTO::getActiveTicketCount)
                        .thenComparing(TechnicianRecommendationDTO::getName, String.CASE_INSENSITIVE_ORDER))
                .collect(Collectors.toList());
    }

    // ✅ UPDATE STATUS
    @Transactional
    public TicketResponseDTO updateTicketStatus(String ticketId, String newStatus, String reason, String userId, String userRole) {

        TicketModel ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found"));

        if (!canManageTicket(ticket, userId, userRole)) {
            throw new AccessDeniedException("Only admins or the assigned technician can update this ticket");
        }

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

        if (TicketStatus.RESOLVED.equals(newStatusEnum) || TicketStatus.CLOSED.equals(newStatusEnum)) {
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
    public TicketResponseDTO assignTechnicians(String ticketId, List<String> technicianIds, String assignedBy) {

        TicketModel ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found"));

        if (TicketStatus.CLOSED.equals(ticket.getStatus())
                || TicketStatus.REJECTED.equals(ticket.getStatus())) {
            throw new InvalidTicketStatusException("Cannot assign technician to a closed or rejected ticket");
        }

        List<String> requestedTechnicianIds = normalizeTechnicianIds(technicianIds);
        if (requestedTechnicianIds.isEmpty()) {
            throw new IllegalArgumentException("At least one technician must be selected");
        }

        Set<String> alreadyAssignedIds = new LinkedHashSet<>(getAssignedTechnicianIds(ticket));
        LinkedHashMap<String, String> mergedAssignments = getAssignedTechnicianMap(ticket);
        List<User> newlyAssignedTechnicians = new ArrayList<>();

        for (String technicianId : requestedTechnicianIds) {
            User technician = userRepository.findById(technicianId)
                    .orElseThrow(() -> new TicketNotFoundException("Technician not found"));

            if (!isActiveTechnician(technician)) {
                throw new AccessDeniedException("Selected user is not an active technician");
            }

            if (!alreadyAssignedIds.contains(technicianId)
                    && hasActiveAssignmentsForOtherTickets(technicianId, ticketId)) {
                throw new AccessDeniedException("Technician " + resolveDisplayName(technician)
                        + " is already assigned to another active ticket");
            }

            mergedAssignments.put(technicianId, resolveDisplayName(technician));

            if (!alreadyAssignedIds.contains(technicianId)) {
                newlyAssignedTechnicians.add(technician);
            }
        }

        syncAssignedTechnicians(ticket, mergedAssignments);
        ticket.setUpdatedAt(LocalDateTime.now());

        if (TicketStatus.OPEN.equals(ticket.getStatus())) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }

        TicketModel updated = ticketRepository.save(ticket);

        String assignedByLabel = resolveAssignedByLabel(assignedBy);
        newlyAssignedTechnicians.forEach(technician ->
                notificationService.notifyTicketAssigned(updated, technician, assignedByLabel));

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
            ticket.setUserFeedback(feedback); // Make sure this field exists
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
        boolean isAuthorized = userRole.equals("ADMIN") || isAssignedTechnician(ticket, userId);
        
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

    // Search tickets by keyword
    public List<TicketResponseDTO> searchTickets(String keyword, String userId, String userRole) {
        return ticketRepository.searchByKeyword(keyword)
                .stream()
                .filter(ticket -> canAccessTicket(ticket, userId, userRole))
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    private TechnicianRecommendationDTO toTechnicianRecommendation(
            User technician,
            Set<String> desiredSkills,
            boolean alreadyAssigned) {
        Set<String> technicianSkills = normalizeSkills(technician.getTechnicianSkills());
        List<String> matchedSkills = technicianSkills.stream()
                .filter(desiredSkills::contains)
                .sorted()
                .collect(Collectors.toList());
        int activeTicketCount = countActiveAssignments(technician.getId());
        int score = (matchedSkills.size() * 100) - (activeTicketCount * 10);

        List<String> reasons = new ArrayList<>();
        if (alreadyAssigned) {
            reasons.add("Already assigned to this ticket");
        }
        if (!matchedSkills.isEmpty()) {
            reasons.add("Skills match: " + String.join(", ", matchedSkills));
        }
        if (activeTicketCount == 0) {
            reasons.add("No active assigned tickets");
        } else {
            reasons.add(activeTicketCount + " active assigned ticket" + (activeTicketCount == 1 ? "" : "s"));
        }
        if (matchedSkills.isEmpty() && technicianSkills.isEmpty()) {
            reasons.add("No technician skills configured yet");
        }

        return TechnicianRecommendationDTO.builder()
                .id(technician.getId())
                .name(resolveDisplayName(technician))
                .email(technician.getEmail())
                .skills(new LinkedHashSet<>(technicianSkills))
                .activeTicketCount(activeTicketCount)
                .matchScore(score)
                .recommended(alreadyAssigned || !matchedSkills.isEmpty())
                .alreadyAssigned(alreadyAssigned)
                .available(true)
                .reasons(reasons)
                .build();
    }

    private Set<String> deriveDesiredSkills(TicketModel ticket) {
        Set<String> desiredSkills = new LinkedHashSet<>();

        if (ticket.getCategory() != null) {
            desiredSkills.add(ticket.getCategory().name().toLowerCase(Locale.ROOT));
        }

        if (ticket.getResourceId() != null && !ticket.getResourceId().isBlank()) {
            try {
                Resource resource = resourceService.getResourceById(ticket.getResourceId());
                if (resource != null && resource.getType() != null) {
                    desiredSkills.add(resource.getType().name().toLowerCase(Locale.ROOT));
                }
            } catch (Exception ignored) {
                // Best-effort enrichment only.
            }
        }

        return desiredSkills;
    }

    private int countActiveAssignments(String technicianId) {
        return (int) ticketRepository.findByAssignedTechnician(technicianId).stream()
                .filter(ticket -> isBlockingAssignmentStatus(ticket.getStatus()))
                .count();
    }

    private boolean isActiveTechnician(User user) {
        return user != null
                && user.isEnabled()
                && user.getRoles() != null
                && user.getRoles().contains(Role.TECHNICIAN);
    }

    private Set<String> normalizeSkills(Set<String> rawSkills) {
        if (rawSkills == null) {
            return Set.of();
        }

        return rawSkills.stream()
                .filter(skill -> skill != null && !skill.isBlank())
                .map(skill -> skill.trim().toLowerCase(Locale.ROOT))
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private String resolveDisplayName(User user) {
        if (user.getName() != null && !user.getName().isBlank()) {
            return user.getName();
        }
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            return user.getEmail();
        }
        return "Technician";
    }

    private String resolveAssignedByLabel(String assignedBy) {
        return userRepository.findById(assignedBy)
                .map(this::resolveDisplayName)
                .orElse(assignedBy);
    }

    private boolean canAccessTicket(TicketModel ticket, String userId, String userRole) {
        if (isAdmin(userRole)) {
            return true;
        }

        if (userId == null || userId.isBlank()) {
            return false;
        }

        if (userId.equals(ticket.getCreatedBy())) {
            return true;
        }

        return isTechnician(userRole) && isAssignedTechnician(ticket, userId);
    }

    private boolean canManageTicket(TicketModel ticket, String userId, String userRole) {
        return isAdmin(userRole)
                || (isTechnician(userRole) && isAssignedTechnician(ticket, userId));
    }

    private boolean isAdmin(String userRole) {
        return "ADMIN".equalsIgnoreCase(userRole);
    }

    private boolean isTechnician(String userRole) {
        return "TECHNICIAN".equalsIgnoreCase(userRole);
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
        List<String> assignedTechnicianIds = getAssignedTechnicianIds(ticket);
        List<String> assignedTechnicianNames = getAssignedTechnicianNames(ticket);
        String assignedTechnicianSummary = assignedTechnicianNames.isEmpty()
                ? null
                : String.join(", ", assignedTechnicianNames);

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
        dto.setCreatedByName(ticket.getCreatedByName());
        dto.setAssignedTo(assignedTechnicianSummary);
        dto.setAssignedToName(assignedTechnicianSummary);
        dto.setAssignedTechnicianIds(assignedTechnicianIds);
        dto.setAssignedTechnicianNames(assignedTechnicianNames);
        dto.setAttachmentUrls(ticket.getAttachmentIds());
        dto.setResolutionNotes(ticket.getResolutionNotes());
        dto.setRejectionReason(ticket.getRejectionReason());
        dto.setUserFeedback(ticket.getUserFeedback());
        dto.setCreatedAt(ticket.getCreatedAt());
        dto.setUpdatedAt(ticket.getUpdatedAt());
        dto.setResolvedAt(ticket.getResolvedAt());
        dto.setClosedAt(ticket.getClosedAt());
        dto.setFirstResponseAt(ticket.getFirstResponseAt());
        dto.setCommentCount(commentCount);

        return dto;
    }

    private boolean hasActiveAssignmentsForOtherTickets(String technicianId, String currentTicketId) {
        return ticketRepository.findByAssignedTechnician(technicianId).stream()
                .filter(ticket -> !Objects.equals(ticket.getId(), currentTicketId))
                .anyMatch(ticket -> isBlockingAssignmentStatus(ticket.getStatus()));
    }

    private boolean isBlockingAssignmentStatus(TicketStatus status) {
        return status != null
                && !TicketStatus.CLOSED.equals(status)
                && !TicketStatus.REJECTED.equals(status);
    }

    private boolean isAssignedTechnician(TicketModel ticket, String userId) {
        return userId != null
                && !userId.isBlank()
                && getAssignedTechnicianIds(ticket).contains(userId);
    }

    private List<String> normalizeTechnicianIds(List<String> technicianIds) {
        if (technicianIds == null) {
            return List.of();
        }

        return technicianIds.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(id -> !id.isBlank())
                .distinct()
                .collect(Collectors.toList());
    }

    private LinkedHashMap<String, String> getAssignedTechnicianMap(TicketModel ticket) {
        List<String> technicianIds = getAssignedTechnicianIds(ticket);
        List<String> technicianNames = getAssignedTechnicianNames(ticket);
        LinkedHashMap<String, String> assignments = new LinkedHashMap<>();

        for (int index = 0; index < technicianIds.size(); index++) {
            String technicianId = technicianIds.get(index);
            String technicianName = index < technicianNames.size()
                    ? technicianNames.get(index)
                    : userRepository.findById(technicianId)
                            .map(this::resolveDisplayName)
                            .orElse(technicianId);
            assignments.put(technicianId, technicianName);
        }

        return assignments;
    }

    private void syncAssignedTechnicians(TicketModel ticket, Map<String, String> assignments) {
        List<String> technicianIds = new ArrayList<>(assignments.keySet());
        List<String> technicianNames = new ArrayList<>(assignments.values());

        ticket.setAssignedTechnicianIds(technicianIds);
        ticket.setAssignedTechnicianNames(technicianNames);
        ticket.setAssignedTo(technicianIds.isEmpty() ? null : technicianIds.get(0));
        ticket.setAssignedToName(technicianNames.isEmpty() ? null : String.join(", ", technicianNames));
    }

    private List<String> getAssignedTechnicianIds(TicketModel ticket) {
        LinkedHashSet<String> technicianIds = new LinkedHashSet<>();

        if (ticket.getAssignedTechnicianIds() != null) {
            ticket.getAssignedTechnicianIds().stream()
                    .filter(Objects::nonNull)
                    .map(String::trim)
                    .filter(id -> !id.isBlank())
                    .forEach(technicianIds::add);
        }

        if (technicianIds.isEmpty()
                && ticket.getAssignedTo() != null
                && !ticket.getAssignedTo().isBlank()) {
            technicianIds.add(ticket.getAssignedTo().trim());
        }

        return new ArrayList<>(technicianIds);
    }

    private List<String> getAssignedTechnicianNames(TicketModel ticket) {
        LinkedHashSet<String> technicianNames = new LinkedHashSet<>();

        if (ticket.getAssignedTechnicianNames() != null) {
            ticket.getAssignedTechnicianNames().stream()
                    .filter(Objects::nonNull)
                    .map(String::trim)
                    .filter(name -> !name.isBlank())
                    .forEach(technicianNames::add);
        }

        if (technicianNames.isEmpty()
                && ticket.getAssignedToName() != null
                && !ticket.getAssignedToName().isBlank()) {
            String[] legacyNames = ticket.getAssignedToName().split(",");
            for (String legacyName : legacyNames) {
                String normalizedName = legacyName.trim();
                if (!normalizedName.isBlank()) {
                    technicianNames.add(normalizedName);
                }
            }
        }

        return new ArrayList<>(technicianNames);
    }
}
