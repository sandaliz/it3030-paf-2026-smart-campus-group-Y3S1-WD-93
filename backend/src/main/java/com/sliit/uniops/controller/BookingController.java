package com.sliit.uniops.controller;

import com.sliit.uniops.model.Booking;
import com.sliit.uniops.model.Resource;
import com.sliit.uniops.service.BookingService;
import com.sliit.uniops.dto.request.BookingRequestDTO;
import com.sliit.uniops.dto.request.BookingUpdateRequestDTO;
import com.sliit.uniops.dto.response.BookingResponseDTO;
import com.sliit.uniops.dto.response.BookingStatusUpdateDTO;
import com.sliit.uniops.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "http://localhost:5173")
public class BookingController {
    
    @Autowired
    private BookingService bookingService;
    
    // ========== CREATE (INSERT) OPERATIONS ==========
    
    // POST: Create a new booking request
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER', 'STUDENT')")
    public ResponseEntity<BookingResponseDTO> createBooking(
            @Valid @RequestBody BookingRequestDTO request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Booking booking = bookingService.createBooking(request, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(BookingResponseDTO.fromBooking(booking));
    }
    
    // POST: Bulk create multiple bookings (admin only)
    @PostMapping("/admin/bulk")
    @PreAuthorize("hasAnyRole('ADMIN', 'BOOKING_MANAGER')")
    public ResponseEntity<List<BookingResponseDTO>> createMultipleBookings(
            @Valid @RequestBody List<BookingRequestDTO> requests,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<Booking> bookings = bookingService.createMultipleBookings(requests, currentUser.getId());
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
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<Booking> bookings = bookingService.getUserBookings(currentUser.getId());
        List<BookingResponseDTO> response = bookings.stream()
                .map(BookingResponseDTO::fromBooking)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }
    
    // GET: Admin views all bookings (with optional filters)
    @GetMapping("/admin/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'BOOKING_MANAGER')")
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
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Booking booking = bookingService.getBookingById(bookingId, currentUser.getId(), isAdmin(currentUser));
        return ResponseEntity.ok(BookingResponseDTO.fromBooking(booking));
    }
    
    // GET: Get bookings by date range
    @GetMapping("/date-range")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER', 'STUDENT')")
    public ResponseEntity<List<BookingResponseDTO>> getBookingsByDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<Booking> bookings = bookingService.getBookingsByDateRange(startDate, endDate, currentUser.getId(), isAdmin(currentUser));
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
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Booking booking = bookingService.updateBooking(
            bookingId, 
            updateRequest, 
            currentUser.getId(), 
            isAdmin(currentUser)
        );
        return ResponseEntity.ok(BookingResponseDTO.fromBooking(booking));
    }
    
    // PATCH: Partial update of a booking (specific fields only)
    @PatchMapping("/{bookingId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER', 'STUDENT')")
    public ResponseEntity<BookingResponseDTO> partialUpdateBooking(
            @PathVariable String bookingId,
            @RequestBody BookingUpdateRequestDTO updateRequest,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Booking booking = bookingService.partialUpdateBooking(
            bookingId, 
            updateRequest, 
            currentUser.getId(), 
            isAdmin(currentUser)
        );
        return ResponseEntity.ok(BookingResponseDTO.fromBooking(booking));
    }
    
    // PATCH: Admin approves/rejects a booking (status update)
    @PatchMapping("/admin/{bookingId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'BOOKING_MANAGER')")
    public ResponseEntity<BookingResponseDTO> updateBookingStatus(
            @PathVariable String bookingId,
            @Valid @RequestBody BookingStatusUpdateDTO update,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        
        Booking booking;
        if ("APPROVED".equals(update.getStatus())) {
            booking = bookingService.approveBooking(bookingId, update.getReason(), currentUser.getId());
        } else if ("REJECTED".equals(update.getStatus())) {
            booking = bookingService.rejectBooking(bookingId, update.getReason(), currentUser.getId());
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
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Booking booking = bookingService.rescheduleBooking(
            bookingId, 
            newDate, 
            newStartTime, 
            newEndTime, 
            currentUser.getId(), 
            isAdmin(currentUser)
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
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Booking booking = bookingService.updateBookingDetails(
            bookingId, 
            purpose, 
            expectedAttendees, 
            currentUser.getId(), 
            isAdmin(currentUser)
        );
        return ResponseEntity.ok(BookingResponseDTO.fromBooking(booking));
    }
    
    // ========== DELETE OPERATIONS ==========
    
    // DELETE: Cancel a booking (soft delete - status to CANCELLED)
    @DeleteMapping("/{bookingId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER', 'STUDENT')")
    public ResponseEntity<Void> cancelBooking(
            @PathVariable String bookingId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        bookingService.cancelBooking(bookingId, currentUser.getId(), isAdmin(currentUser));
        return ResponseEntity.noContent().build();
    }
    
    // DELETE: Hard delete a booking (admin only - remove from database)
    @DeleteMapping("/admin/{bookingId}/permanent")
    @PreAuthorize("hasAnyRole('ADMIN', 'BOOKING_MANAGER')")
    public ResponseEntity<Void> permanentDeleteBooking(@PathVariable String bookingId) {
        bookingService.permanentDeleteBooking(bookingId);
        return ResponseEntity.noContent().build();
    }
    
    // DELETE: Delete all bookings for a user (admin only)
    @DeleteMapping("/admin/user/{userId}/bookings")
    @PreAuthorize("hasAnyRole('ADMIN', 'BOOKING_MANAGER')")
    public ResponseEntity<Void> deleteAllUserBookings(@PathVariable String userId) {
        bookingService.deleteAllUserBookings(userId);
        return ResponseEntity.noContent().build();
    }
    
    // DELETE: Delete all cancelled bookings (admin only - cleanup)
    @DeleteMapping("/admin/cleanup/cancelled")
    @PreAuthorize("hasAnyRole('ADMIN', 'BOOKING_MANAGER')")
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

    @GetMapping("/alternative-resources")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER', 'STUDENT')")
    public ResponseEntity<List<Resource>> getAlternativeResources(
            @RequestParam String unavailableResourceId,
            @RequestParam String date,
            @RequestParam String startTime,
            @RequestParam String endTime,
            @RequestParam(required = false) Integer minCapacity) {
        List<Resource> resources = bookingService.getAlternativeResources(
            unavailableResourceId, date, startTime, endTime, minCapacity
        );
        return ResponseEntity.ok(resources);
    }

    @GetMapping("/admin/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'BOOKING_MANAGER')")
    public ResponseEntity<byte[]> exportBookings(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String resourceId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        List<Booking> bookings = bookingService.getAllBookings(status, resourceId, userId, startDate, endDate);
        byte[] csv = bookingService.generateBookingReport(bookings);
        String dateSuffix = LocalDate.now().toString();

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=booking-report-" + dateSuffix + ".csv")
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(csv);
    }

    @GetMapping("/admin/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'BOOKING_MANAGER')")
    public ResponseEntity<Map<String, Object>> getBookingStatistics() {
        return ResponseEntity.ok(bookingService.getBookingStatistics());
    }

    @GetMapping("/admin/paginated")
    @PreAuthorize("hasAnyRole('ADMIN', 'BOOKING_MANAGER')")
    public ResponseEntity<Map<String, Object>> getPaginatedBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String resourceId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(
            bookingService.getPaginatedBookings(page, size, status, resourceId, userId, startDate, endDate)
        );
    }

    @PatchMapping("/admin/bulk-status")
    @PreAuthorize("hasAnyRole('ADMIN', 'BOOKING_MANAGER')")
    public ResponseEntity<List<BookingResponseDTO>> bulkUpdateBookingStatus(
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        @SuppressWarnings("unchecked")
        List<String> bookingIds = (List<String>) payload.getOrDefault("bookingIds", java.util.Collections.emptyList());
        String status = (String) payload.get("status");
        String reason = (String) payload.get("reason");

        List<BookingResponseDTO> response = bookingService
            .bulkUpdateBookingStatus(bookingIds, status, reason, currentUser.getId())
            .stream()
            .map(BookingResponseDTO::fromBooking)
            .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/admin/conflicts")
    @PreAuthorize("hasAnyRole('ADMIN', 'BOOKING_MANAGER')")
    public ResponseEntity<List<Map<String, Object>>> getBookingConflicts(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        return ResponseEntity.ok(bookingService.getBookingConflicts(startDate, endDate));
    }

    @GetMapping("/admin/utilization")
    @PreAuthorize("hasAnyRole('ADMIN', 'BOOKING_MANAGER')")
    public ResponseEntity<List<Map<String, Object>>> getResourceUtilization(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        return ResponseEntity.ok(bookingService.getResourceUtilization(startDate, endDate));
    }

    @GetMapping("/admin/user/{userId}/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'BOOKING_MANAGER')")
    public ResponseEntity<Map<String, Object>> getUserBookingHistory(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(bookingService.getUserBookingHistory(userId, page, size));
    }

    @PostMapping("/admin/recurring")
    @PreAuthorize("hasAnyRole('ADMIN', 'BOOKING_MANAGER')")
    public ResponseEntity<List<BookingResponseDTO>> createRecurringBookings(
            @RequestBody Map<String, List<BookingRequestDTO>> payload,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<BookingRequestDTO> requests = payload.getOrDefault("bookings", java.util.Collections.emptyList());
        List<BookingResponseDTO> response = bookingService.createRecurringBookings(requests, currentUser.getId())
            .stream()
            .map(BookingResponseDTO::fromBooking)
            .collect(Collectors.toList());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    private boolean isAdmin(UserPrincipal currentUser) {
        return currentUser != null && currentUser.getAuthorities().stream()
            .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }
}
