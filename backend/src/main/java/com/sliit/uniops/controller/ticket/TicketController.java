package com.sliit.uniops.controller.ticket;

import com.sliit.uniops.dto.request.ticket.TicketRequestDTO;
import com.sliit.uniops.dto.response.ticket.TechnicianRecommendationDTO;
import com.sliit.uniops.dto.response.ticket.TicketResponseDTO;
import com.sliit.uniops.security.UserPrincipal;
import com.sliit.uniops.service.ticket.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {
    private final TicketService ticketService;

    @PostMapping(consumes = {"multipart/form-data"})
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TicketResponseDTO> createTicket(
            @Valid @ModelAttribute TicketRequestDTO request,
            Authentication authentication) {

        String userId = getUserId(authentication);
        String userName = getUserName(authentication);

        TicketResponseDTO ticket = ticketService.createTicket(request, userId, userName);
        return ResponseEntity.status(HttpStatus.CREATED).body(ticket);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TicketResponseDTO> getTicketById(
            @PathVariable String id,
            Authentication authentication) {
        TicketResponseDTO ticket = ticketService.getTicketById(
                id,
                getUserId(authentication),
                getPrimaryRole(authentication)
        );
        return ResponseEntity.ok(ticket);
    }

    @GetMapping("/my-tickets")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<TicketResponseDTO>> getMyTickets(
            Authentication authentication,
            Pageable pageable) {

        String userId = getUserId(authentication);
        Page<TicketResponseDTO> tickets = ticketService.getTicketsByUser(userId, pageable);
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/assigned-to-me")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<Page<TicketResponseDTO>> getAssignedTickets(
            Authentication authentication,
            Pageable pageable) {

        String technicianId = getUserId(authentication);
        Page<TicketResponseDTO> tickets = ticketService.getTicketsByTechnician(technicianId, pageable);
        return ResponseEntity.ok(tickets);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<TicketResponseDTO>> getAllTickets(Pageable pageable) {
        Page<TicketResponseDTO> tickets = ticketService.getAllTickets(pageable);
        return ResponseEntity.ok(tickets);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<TicketResponseDTO> updateStatus(
            @PathVariable String id,
            @RequestParam String status,
            @RequestParam(required = false) String reason,
            Authentication authentication) {


        String userId = getUserId(authentication);
        String userRole = getPrimaryRole(authentication);

        TicketResponseDTO ticket = ticketService.updateTicketStatus(id, status, reason, userId, userRole);
        return ResponseEntity.ok(ticket);
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TicketResponseDTO> assignTechnician(
            @PathVariable String id,
            @RequestParam String technicianId,
            Authentication authentication) {


        String assignedBy = getUserId(authentication);

        TicketResponseDTO ticket = ticketService.assignTechnician(id, technicianId, assignedBy);
        return ResponseEntity.ok(ticket);
    }

    @GetMapping("/{id}/recommended-technicians")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TechnicianRecommendationDTO>> getRecommendedTechnicians(@PathVariable String id) {
        return ResponseEntity.ok(ticketService.getRecommendedTechnicians(id));
    }

    @PatchMapping("/{id}/confirm")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TicketResponseDTO> confirmTicket(
            @PathVariable String id,
            @RequestParam(required = false) String feedback,
            Authentication authentication) {

        TicketResponseDTO ticket = ticketService.confirmTicketResolution(id, getUserId(authentication), feedback);
        return ResponseEntity.ok(ticket);
    }

    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<TicketResponseDTO>> searchTickets(
            @RequestParam String keyword,
            Authentication authentication) {
        List<TicketResponseDTO> tickets = ticketService.searchTickets(
                keyword,
                getUserId(authentication),
                getPrimaryRole(authentication)
        );
        return ResponseEntity.ok(tickets);
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

    private String getPrimaryRole(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(auth -> auth.getAuthority().replace("ROLE_", ""))
                .findFirst()
                .orElse("USER");
    }
}
