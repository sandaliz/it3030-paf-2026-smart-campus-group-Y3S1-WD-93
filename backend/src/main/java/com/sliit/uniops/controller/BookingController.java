package com.sliit.uniops.controller;

import com.sliit.uniops.model.Booking;
import com.sliit.uniops.service.BookingService;
import com.sliit.uniops.dto.request.BookingRequestDTO;
import com.sliit.uniops.dto.request.BookingUpdateRequestDTO;
import com.sliit.uniops.dto.response.BookingResponseDTO;
import com.sliit.uniops.dto.response.BookingStatusUpdateDTO;
import com.sliit.uniops.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
    
    // ========== CREATE (INSERT) OPERATIONS ==========
    
    // POST: Create a new booking request
    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<BookingResponseDTO> createBooking(
            @Valid @RequestBody BookingRequestDTO request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Booking booking = bookingService.createBooking(request, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(BookingResponseDTO.fromBooking(booking));
    }
    
    // POST: Bulk create multiple bookings (admin only)
    @PostMapping("/admin/bulk")
    @PreAuthorize("hasRole('ADMIN')")
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
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
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
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<BookingResponseDTO> getBookingById(
            @PathVariable String bookingId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Booking booking = bookingService.getBookingById(bookingId, currentUser.getId(), currentUser.isAdmin());
        return ResponseEntity.ok(BookingResponseDTO.fromBooking(booking));
    }
    
    // GET: Get bookings by date range
    @GetMapping("/date-range")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<BookingResponseDTO>> getBookingsByDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<Booking> bookings = bookingService.getBookingsByDateRange(startDate, endDate, currentUser.getId(), currentUser.isAdmin());
        List<BookingResponseDTO> response = bookings.stream()
                .map(BookingResponseDTO::fromBooking)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }
    
    // GET: Check availability for a resource
    @GetMapping("/check-availability")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Boolean> checkAvailability(
            @RequestParam String resourceId,
            @RequestParam String date,
            @RequestParam String startTime,
            @RequestParam String endTime) {
        boolean isAvailable = bookingService.checkAvailability(resourceId, date, startTime, endTime);
        return ResponseEntity.ok(isAvailable);
    }
    
    // ========== UPDATE OPERATIONS ==========
    
    // PUT: Complete update of a booking (full replacement)
    @PutMapping("/{bookingId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<BookingResponseDTO> updateBooking(
            @PathVariable String bookingId,
            @Valid @RequestBody BookingUpdateRequestDTO updateRequest,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Booking booking = bookingService.updateBooking(
            bookingId, 
            updateRequest, 
            currentUser.getId(), 
            currentUser.isAdmin()
        );
        return ResponseEntity.ok(BookingResponseDTO.fromBooking(booking));
    }
    
    // PATCH: Partial update of a booking (specific fields only)
    @PatchMapping("/{bookingId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<BookingResponseDTO> partialUpdateBooking(
            @PathVariable String bookingId,
            @RequestBody BookingUpdateRequestDTO updateRequest,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Booking booking = bookingService.partialUpdateBooking(
            bookingId, 
            updateRequest, 
            currentUser.getId(), 
            currentUser.isAdmin()
        );
        return ResponseEntity.ok(BookingResponseDTO.fromBooking(booking));
    }
    
    // PATCH: Admin approves/rejects a booking (status update)
    @PatchMapping("/admin/{bookingId}/status")
    @PreAuthorize("hasRole('ADMIN')")
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
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
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
            currentUser.isAdmin()
        );
        return ResponseEntity.ok(BookingResponseDTO.fromBooking(booking));
    }
    
    // PATCH: Update booking purpose/details
    @PatchMapping("/{bookingId}/details")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
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
            currentUser.isAdmin()
        );
        return ResponseEntity.ok(BookingResponseDTO.fromBooking(booking));
    }
    
    // ========== DELETE OPERATIONS ==========
    
    // DELETE: Cancel a booking (soft delete - status to CANCELLED)
    @DeleteMapping("/{bookingId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Void> cancelBooking(
            @PathVariable String bookingId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        bookingService.cancelBooking(bookingId, currentUser.getId(), currentUser.isAdmin());
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
}