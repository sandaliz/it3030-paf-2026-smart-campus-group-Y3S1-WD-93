package com.sliit.uniops.controller;

import com.sliit.uniops.model.Booking;
import com.sliit.uniops.model.Resource;
import com.sliit.uniops.model.User;
import com.sliit.uniops.service.BookingService;
import com.sliit.uniops.dto.request.BookingRequestDTO;
import com.sliit.uniops.dto.request.BookingUpdateRequestDTO;
import com.sliit.uniops.dto.response.BookingResponseDTO;
import com.sliit.uniops.dto.response.BookingStatusUpdateDTO;
import com.sliit.uniops.exception.UnauthorizedException;
import com.sliit.uniops.repository.UserRepository;
import com.sliit.uniops.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "http://localhost:5173")
public class BookingController {
    
    @Autowired
    private BookingService bookingService;

    @Autowired
    private UserRepository userRepository;
    
    // ========== CREATE (INSERT) OPERATIONS ==========
    
    // POST: Create a new booking request
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER', 'STUDENT')")
    public ResponseEntity<BookingResponseDTO> createBooking(
            @Valid @RequestBody BookingRequestDTO request,
            Authentication authentication) {
        Booking booking = bookingService.createBooking(request, getCurrentUserId(authentication));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(BookingResponseDTO.fromBooking(booking));
    }
    
    // POST: Bulk create multiple bookings (admin only)
    @PostMapping("/admin/bulk")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BookingResponseDTO>> createMultipleBookings(
            @Valid @RequestBody List<BookingRequestDTO> requests,
            Authentication authentication) {
        List<Booking> bookings = bookingService.createMultipleBookings(requests, getCurrentUserId(authentication));
        List<BookingResponseDTO> response = bookings.stream()
                .map(BookingResponseDTO::fromBooking)
                .collect(Collectors.toList());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    // ========== READ (SELECT) OPERATIONS ==========
    
    // GET: User views their own bookings
    @GetMapping("/my-bookings")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER', 'STUDENT')")
    public ResponseEntity<List<BookingResponseDTO>> getMyBookings(
            Authentication authentication) {
        List<Booking> bookings = bookingService.getUserBookings(getCurrentUserId(authentication));
        List<BookingResponseDTO> response = bookings.stream()
                .map(BookingResponseDTO::fromBooking)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }
    
    // GET: Admin views all bookings (with optional filters)
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BookingResponseDTO>> getAllBookings(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String resourceId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        List<Booking> bookings = bookingService.getAllBookings(status, resourceId, userId, startDate, endDate);
        List<BookingResponseDTO> response = bookings.stream()
                .map(BookingResponseDTO::fromBooking)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }
    
    // GET: Get single booking by ID
    @GetMapping("/{bookingId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER', 'STUDENT')")
    public ResponseEntity<BookingResponseDTO> getBookingById(
            @PathVariable String bookingId,
            Authentication authentication) {
        Booking booking = bookingService.getBookingById(
            bookingId,
            getCurrentUserId(authentication),
            isAdmin(authentication)
        );
        return ResponseEntity.ok(BookingResponseDTO.fromBooking(booking));
    }
    
    // GET: Get bookings by date range
    @GetMapping("/date-range")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER', 'STUDENT')")
    public ResponseEntity<List<BookingResponseDTO>> getBookingsByDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate,
            Authentication authentication) {
        List<Booking> bookings = bookingService.getBookingsByDateRange(
            startDate,
            endDate,
            getCurrentUserId(authentication),
            isAdmin(authentication)
        );
        List<BookingResponseDTO> response = bookings.stream()
                .map(BookingResponseDTO::fromBooking)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    
    // ========== UPDATE OPERATIONS ==========
    
    // PUT: Complete update of a booking (full replacement)
    @PutMapping("/{bookingId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER', 'STUDENT')")
    public ResponseEntity<BookingResponseDTO> updateBooking(
            @PathVariable String bookingId,
            @Valid @RequestBody BookingUpdateRequestDTO updateRequest,
            Authentication authentication) {
        Booking booking = bookingService.updateBooking(
            bookingId, 
            updateRequest, 
            getCurrentUserId(authentication), 
            isAdmin(authentication)
        );
        return ResponseEntity.ok(BookingResponseDTO.fromBooking(booking));
    }
    
    // PATCH: Partial update of a booking (specific fields only)
    @PatchMapping("/{bookingId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER', 'STUDENT')")
    public ResponseEntity<BookingResponseDTO> partialUpdateBooking(
            @PathVariable String bookingId,
            @RequestBody BookingUpdateRequestDTO updateRequest,
            Authentication authentication) {
        Booking booking = bookingService.partialUpdateBooking(
            bookingId, 
            updateRequest, 
            getCurrentUserId(authentication), 
            isAdmin(authentication)
        );
        return ResponseEntity.ok(BookingResponseDTO.fromBooking(booking));
    }
    
    // PATCH: Admin approves/rejects a booking (status update)
    @PatchMapping("/admin/{bookingId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingResponseDTO> updateBookingStatus(
            @PathVariable String bookingId,
            @Valid @RequestBody BookingStatusUpdateDTO update,
            Authentication authentication) {
        
        Booking booking;
        if ("APPROVED".equals(update.getStatus())) {
            booking = bookingService.approveBooking(bookingId, update.getReason(), getCurrentUserId(authentication));
        } else if ("REJECTED".equals(update.getStatus())) {
            booking = bookingService.rejectBooking(bookingId, update.getReason(), getCurrentUserId(authentication));
        } else {
            throw new IllegalArgumentException("Invalid status. Must be APPROVED or REJECTED");
        }
        
        return ResponseEntity.ok(BookingResponseDTO.fromBooking(booking));
    }
    
    // PATCH: Update booking date/time (reschedule)
    @PatchMapping("/{bookingId}/reschedule")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER', 'STUDENT')")
    public ResponseEntity<BookingResponseDTO> rescheduleBooking(
            @PathVariable String bookingId,
            @RequestParam String newDate,
            @RequestParam String newStartTime,
            @RequestParam String newEndTime,
            Authentication authentication) {
        Booking booking = bookingService.rescheduleBooking(
            bookingId, 
            newDate, 
            newStartTime, 
            newEndTime, 
            getCurrentUserId(authentication), 
            isAdmin(authentication)
        );
        return ResponseEntity.ok(BookingResponseDTO.fromBooking(booking));
    }
    
    // PATCH: Update booking purpose/details
    @PatchMapping("/{bookingId}/details")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER', 'STUDENT')")
    public ResponseEntity<BookingResponseDTO> updateBookingDetails(
            @PathVariable String bookingId,
            @RequestParam(required = false) String purpose,
            @RequestParam(required = false) Integer expectedAttendees,
            Authentication authentication) {
        Booking booking = bookingService.updateBookingDetails(
            bookingId, 
            purpose, 
            expectedAttendees, 
            getCurrentUserId(authentication), 
            isAdmin(authentication)
        );
        return ResponseEntity.ok(BookingResponseDTO.fromBooking(booking));
    }
    
    // ========== DELETE OPERATIONS ==========
    
    // DELETE: Cancel a booking (soft delete - status to CANCELLED)
    @DeleteMapping("/{bookingId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER', 'STUDENT')")
    public ResponseEntity<Void> cancelBooking(
            @PathVariable String bookingId,
            Authentication authentication) {
        bookingService.cancelBooking(bookingId, getCurrentUserId(authentication), isAdmin(authentication));
        return ResponseEntity.noContent().build();
    }
    
    // DELETE: Hard delete a booking (admin only - remove from database)
    @DeleteMapping("/admin/{bookingId}/permanent")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> permanentDeleteBooking(@PathVariable String bookingId) {
        bookingService.permanentDeleteBooking(bookingId);
        return ResponseEntity.noContent().build();
    }
    
    // DELETE: Delete all bookings for a user (admin only)
    @DeleteMapping("/admin/user/{userId}/bookings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAllUserBookings(@PathVariable String userId) {
        bookingService.deleteAllUserBookings(userId);
        return ResponseEntity.noContent().build();
    }
    
    // DELETE: Delete all cancelled bookings (admin only - cleanup)
    @DeleteMapping("/admin/cleanup/cancelled")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Integer> deleteAllCancelledBookings() {
        int deletedCount = bookingService.deleteAllCancelledBookings();
        return ResponseEntity.ok(deletedCount);
    }

    // ===== NEW: Check availability for a specific time slot =====
    @GetMapping("/check-availability")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER', 'STUDENT')")
    public ResponseEntity<Boolean> checkAvailability(
            @RequestParam String resourceId,
            @RequestParam String date,
            @RequestParam String startTime,
            @RequestParam String endTime) {
        boolean isAvailable = bookingService.checkAvailability(resourceId, date, startTime, endTime);
        return ResponseEntity.ok(isAvailable);
    }
    
    // ===== NEW: Get available time slots for a resource =====
    @GetMapping("/available-slots")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER', 'STUDENT')")
    public ResponseEntity<List<String>> getAvailableTimeSlots(
            @RequestParam String resourceId,
            @RequestParam String date) {
        List<String> availableSlots = bookingService.getAvailableTimeSlots(resourceId, date);
        return ResponseEntity.ok(availableSlots);
    }
    
    // ===== NEW: Get all bookings for a specific resource on a date =====
    @GetMapping("/resource/{resourceId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER', 'STUDENT')")
    public ResponseEntity<List<BookingResponseDTO>> getResourceBookings(
            @PathVariable String resourceId,
            @RequestParam String date) {
        List<Booking> bookings = bookingService.getResourceBookings(resourceId, date);
        List<BookingResponseDTO> response = bookings.stream()
                .map(BookingResponseDTO::fromBooking)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }
    
    // ===== NEW: Get available resources based on criteria =====
    @GetMapping("/available-resources")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER', 'STUDENT')")
    public ResponseEntity<List<Resource>> getAvailableResources(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam String date,
            @RequestParam String startTime,
            @RequestParam String endTime) {
        List<Resource> availableResources = bookingService.getAvailableResources(
            type, minCapacity, date, startTime, endTime);
        return ResponseEntity.ok(availableResources);
    }
    
    // ===== NEW: Export bookings to CSV (admin only) =====
    @GetMapping("/admin/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportBookings(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String resourceId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        
        List<Booking> bookings = bookingService.getAllBookings(status, resourceId, userId, startDate, endDate);
        byte[] csvData = bookingService.generateBookingReport(bookings);
        
        return ResponseEntity.ok()
                .header("Content-Type", "text/csv")
                .header("Content-Disposition", "attachment; filename=\"booking_report.csv\"")
                .body(csvData);
    }
    
    // ===== NEW: Get alternative resource suggestions =====
    @GetMapping("/alternative-resources")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER', 'STUDENT')")
    public ResponseEntity<List<Resource>> getAlternativeResources(
            @RequestParam String unavailableResourceId,
            @RequestParam String date,
            @RequestParam String startTime,
            @RequestParam String endTime,
            @RequestParam(required = false) Integer minCapacity) {
        
        List<Resource> alternatives = bookingService.getAlternativeResources(
            unavailableResourceId, date, startTime, endTime, minCapacity);
        return ResponseEntity.ok(alternatives);
    }
    
   
      
    private String getCurrentUserId(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new UnauthorizedException("User is not authenticated");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof UserPrincipal userPrincipal) {
            return userPrincipal.getId();
        }

        String email = null;
        if (principal instanceof OAuth2User oauth2User) {
            Object emailAttr = oauth2User.getAttributes().get("email");
            if (emailAttr != null) {
                email = emailAttr.toString();
            }
        } else if (principal instanceof org.springframework.security.core.userdetails.UserDetails userDetails) {
            email = userDetails.getUsername();
        } else if (principal instanceof String principalString && !"anonymousUser".equals(principalString)) {
            email = principalString;
        }

        if (email == null || email.isBlank()) {
            throw new UnauthorizedException("Authenticated user details are unavailable");
        }

        User user = userRepository.findByEmail(email.toLowerCase().trim())
            .orElseThrow(() -> new UnauthorizedException("Authenticated user was not found"));
        return user.getId();
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication != null &&
            authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }
}
