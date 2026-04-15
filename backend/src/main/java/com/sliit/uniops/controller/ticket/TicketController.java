package com.sliit.uniops.controller.ticket;

import com.sliit.uniops.dto.request.ticket.TicketRequestDTO;
import com.sliit.uniops.dto.response.ticket.TicketResponseDTO;
import com.sliit.uniops.service.ticket.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {
    private final TicketService ticketService;

    @PostMapping(consumes = {"multipart/form-data"})
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
    public ResponseEntity<TicketResponseDTO> createTicket(
            @Valid @ModelAttribute TicketRequestDTO request,
            @AuthenticationPrincipal OidcUser user) {

        String userId = user.getSubject();


        TicketResponseDTO ticket = ticketService.createTicket(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ticket);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TicketResponseDTO> getTicketById(@PathVariable String id) {
        TicketResponseDTO ticket = ticketService.getTicketById(id);
        return ResponseEntity.ok(ticket);
    }

    @GetMapping("/my-tickets")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
    public ResponseEntity<Page<TicketResponseDTO>> getMyTickets(
            @AuthenticationPrincipal OidcUser user,
            Pageable pageable) {

        String userId = user.getSubject();
        Page<TicketResponseDTO> tickets = ticketService.getTicketsByUser(userId, pageable);
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/assigned-to-me")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<Page<TicketResponseDTO>> getAssignedTickets(
            @AuthenticationPrincipal OidcUser user,
            Pageable pageable) {

        String technicianId = user.getSubject();
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
            @AuthenticationPrincipal OidcUser user) {


        TicketResponseDTO ticket = ticketService.updateTicketStatus(id, status, reason);
        return ResponseEntity.ok(ticket);
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TicketResponseDTO> assignTechnician(
            @PathVariable String id,
            @RequestParam String technicianId,
            @RequestParam String technicianName,
            @AuthenticationPrincipal OidcUser user) {


        TicketResponseDTO ticket = ticketService.assignTechnician(id, technicianId);
        return ResponseEntity.ok(ticket);
    }

    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<TicketResponseDTO>> searchTickets(@RequestParam String keyword) {
        List<TicketResponseDTO> tickets = ticketService.searchTickets(keyword);
        return ResponseEntity.ok(tickets);
    }
}
