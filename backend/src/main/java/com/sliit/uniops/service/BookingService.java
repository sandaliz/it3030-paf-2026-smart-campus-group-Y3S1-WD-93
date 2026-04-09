package com.sliit.uniops.service;

import com.sliit.uniops.model.Booking;
import com.sliit.uniops.model.Resource;
import com.sliit.uniops.repository.BookingRepository;
import com.sliit.uniops.repository.ResourceRepository;
import com.sliit.uniops.dto.request.BookingRequestDTO;
import com.sliit.uniops.dto.request.BookingUpdateRequestDTO;
import com.sliit.uniops.dto.response.BookingResponseDTO;
import com.sliit.uniops.exception.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class BookingService {
    
    @Autowired
    private BookingRepository bookingRepository;
    
    @Autowired
    private ResourceRepository resourceRepository;
    
    @Autowired
    private BookingNotificationService notificationService;
    
    // Create a new booking request with conflict checking
    public Booking createBooking(BookingRequestDTO request, String userId) {
        // 1. Validate resource exists and is active
        Resource resource = resourceRepository.findById(request.getResourceId())
            .orElseThrow(() -> new ResourceNotFoundException("Resource not found with ID: " + request.getResourceId()));
        
        if (!Resource.ResourceStatus.ACTIVE.equals(resource.getStatus())) {
            throw new ResourceUnavailableException("Resource is not available for booking. Status: " + resource.getStatus());
        }
        
        // 2. Check for overlapping bookings (CORE FEATURE)
        List<Booking> conflicts = bookingRepository.findConflictingBookings(
            request.getResourceId(),
            request.getDate(),
            request.getStartTime(),
            request.getEndTime()
        );
        
        if (!conflicts.isEmpty()) {
            throw new BookingConflictException(
                String.format("Time slot %s to %s on %s is already booked for resource '%s'",
                    request.getStartTime(), request.getEndTime(), 
                    request.getDate(), resource.getName())
            );
        }
        
        // 3. Create new booking
        Booking booking = new Booking();
        booking.setUserId(userId);
        booking.setResourceId(request.getResourceId());
        booking.setResourceName(resource.getName());
        booking.setResourceType(resource.getType());
        booking.setDate(request.getDate());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setPurpose(request.getPurpose());
        booking.setExpectedAttendees(request.getExpectedAttendees());
        booking.setStatus(Booking.BookingStatus.PENDING);
        booking.setTimestamps();
        
        System.out.println("DEBUG: Saving booking - " + booking.toString());
        System.out.println("DEBUG: MongoDB URI: " + System.getenv().getOrDefault("MONGO_URI", "Not set"));
        try {
            Booking savedBooking = bookingRepository.save(booking);
            System.out.println("DEBUG: Saved booking with ID - " + savedBooking.getId());
            System.out.println("DEBUG: Booking status after save: " + savedBooking.getStatus());
            return savedBooking;
        } catch (Exception e) {
            System.out.println("ERROR: Failed to save booking - " + e.getMessage());
            e.printStackTrace();
            throw e;}
        }
    
    // Create multiple bookings (bulk insert)
    public List<Booking> createMultipleBookings(List<BookingRequestDTO> requests, String userId) {
        return requests.stream()
            .map(request -> createBooking(request, userId))
            .collect(Collectors.toList());
    }


    // Get bookings for a specific user
    public List<Booking> getUserBookings(String userId) {
        return bookingRepository.findByUserId(userId);
    }
    
        
    // Get single booking by ID with authorization check
    public Booking getBookingById(String bookingId, String userId, boolean isAdmin) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new BookingNotFoundException("Booking not found with ID: " + bookingId));
        
        if (!isAdmin && !booking.getUserId().equals(userId)) {
            throw new UnauthorizedException("You don't have permission to view this booking");
        }
        
        return booking;
    }
    
    // Approve a booking (admin only)
    public Booking approveBooking(String bookingId, String reason, String adminId) {
        Booking booking = getBookingOrThrow(bookingId);
        
        if (!Booking.BookingStatus.PENDING.equals(booking.getStatus())) {
            throw new InvalidBookingStateException(
                "Cannot approve booking with status: " + booking.getStatus()
            );
        }
        
        // Double-check for conflicts (in case something changed while pending)
        List<Booking> conflicts = bookingRepository.findConflictingBookings(
            booking.getResourceId(),
            booking.getDate(),
            booking.getStartTime(),
            booking.getEndTime()
        );
        
        // Remove the current booking from conflict check if found
        conflicts.removeIf(b -> b.getId().equals(bookingId));
        
        if (!conflicts.isEmpty()) {
            booking.setStatus(Booking.BookingStatus.REJECTED);
            booking.setRejectionReason("Auto-rejected: New conflict detected during approval");
            bookingRepository.save(booking);
            
            notificationService.sendNotification(
                booking.getUserId(),
                "BOOKING_REJECTED",
                "Your booking was auto-rejected due to a scheduling conflict",
                bookingId
            );
            
            throw new BookingConflictException("New conflict detected. Booking auto-rejected.");
        }
        
        booking.setStatus(Booking.BookingStatus.APPROVED);
        Booking approvedBooking = bookingRepository.save(booking);
        
        notificationService.sendNotification(
            booking.getUserId(),
            "BOOKING_APPROVED",
            "Your booking has been approved" + (reason != null ? " Reason: " + reason : ""),
            bookingId
        );
        
        return approvedBooking;
    }
    
    // Reject a booking (admin only)
    public Booking rejectBooking(String bookingId, String reason, String adminId) {
        Booking booking = getBookingOrThrow(bookingId);
        
        if (!Booking.BookingStatus.PENDING.equals(booking.getStatus())) {
            throw new InvalidBookingStateException(
                "Cannot reject booking with status: " + booking.getStatus()
            );
        }
        
        booking.setStatus(Booking.BookingStatus.REJECTED);
        booking.setRejectionReason(reason);
        Booking rejectedBooking = bookingRepository.save(booking);
        
        notificationService.sendNotification(
            booking.getUserId(),
            "BOOKING_REJECTED",
            "Your booking was rejected. Reason: " + reason,
            bookingId
        );
        
        return rejectedBooking;
    }
    
    // Cancel a booking (user or admin)
    public Booking cancelBooking(String bookingId, String userId, boolean isAdmin) {
        Booking booking = getBookingOrThrow(bookingId);
        
        if (!isAdmin && !booking.getUserId().equals(userId)) {
            throw new UnauthorizedException("You can only cancel your own bookings");
        }
        
        if (!Booking.BookingStatus.APPROVED.equals(booking.getStatus()) && !Booking.BookingStatus.PENDING.equals(booking.getStatus())) {
            throw new InvalidBookingStateException(
                "Cannot cancel booking with status: " + booking.getStatus()
            );
        }
        
        booking.setStatus(Booking.BookingStatus.CANCELLED);
        return bookingRepository.save(booking);
    }
    
    // Helper method
    private Booking getBookingOrThrow(String bookingId) {
        return bookingRepository.findById(bookingId)
            .orElseThrow(() -> new BookingNotFoundException("Booking not found with ID: " + bookingId));
    }

    // Full update of a booking (PUT)
public Booking updateBooking(String bookingId, BookingUpdateRequestDTO updateRequest, String userId, boolean isAdmin) {
    Booking booking = getBookingOrThrow(bookingId);
    
    // Check authorization
    if (!isAdmin && !booking.getUserId().equals(userId)) {
        throw new UnauthorizedException("You can only update your own bookings");
    }
    
    // Check if booking can be updated (only PENDING or APPROVED)
    if (!Booking.BookingStatus.PENDING.equals(booking.getStatus()) && !Booking.BookingStatus.APPROVED.equals(booking.getStatus())) {
        throw new InvalidBookingStateException(
            "Cannot update booking with status: " + booking.getStatus()
        );
    }
    
    // Store old values for conflict check
    String oldResourceId = booking.getResourceId();
    LocalDate oldDate = booking.getDate();
    LocalTime oldStartTime = booking.getStartTime();
    LocalTime oldEndTime = booking.getEndTime();
    
    // Update fields
    if (updateRequest.getResourceId() != null) {
        Resource newResource = resourceRepository.findById(updateRequest.getResourceId())
            .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));
        booking.setResourceId(updateRequest.getResourceId());
        booking.setResourceName(newResource.getName());
        booking.setResourceType(newResource.getType());
    }
    
    if (updateRequest.getDate() != null) {
        booking.setDate(updateRequest.getDate());
    }
    
    if (updateRequest.getStartTime() != null) {
        booking.setStartTime(updateRequest.getStartTime());
    }
    
    if (updateRequest.getEndTime() != null) {
        booking.setEndTime(updateRequest.getEndTime());
    }
    
    if (updateRequest.getPurpose() != null) {
        booking.setPurpose(updateRequest.getPurpose());
    }
    
    if (updateRequest.getExpectedAttendees() != null) {
        booking.setExpectedAttendees(updateRequest.getExpectedAttendees());
    }
    
    // Check for conflicts with updated values
    String checkResourceId = updateRequest.getResourceId() != null ? updateRequest.getResourceId() : oldResourceId;
    LocalDate checkDate = updateRequest.getDate() != null ? updateRequest.getDate() : oldDate;
    LocalTime checkStartTime = updateRequest.getStartTime() != null ? updateRequest.getStartTime() : oldStartTime;
    LocalTime checkEndTime = updateRequest.getEndTime() != null ? updateRequest.getEndTime() : oldEndTime;
    
    List<Booking> conflicts = bookingRepository.findConflictingBookings(
        checkResourceId, checkDate, checkStartTime, checkEndTime
    );
    
    // Remove current booking from conflict check
    conflicts.removeIf(b -> b.getId().equals(bookingId));
    
    if (!conflicts.isEmpty()) {
        throw new BookingConflictException("Updated booking conflicts with existing booking");
    }
    
    booking.setUpdatedAt(LocalDateTime.now());
    return bookingRepository.save(booking);
}

// Partial update (PATCH) - only update provided fields
public Booking partialUpdateBooking(String bookingId, BookingUpdateRequestDTO updateRequest, String userId, boolean isAdmin) {
    if (!updateRequest.hasUpdates()) {
        throw new IllegalArgumentException("No fields provided for update");
    }
    return updateBooking(bookingId, updateRequest, userId, isAdmin);
}

// Reschedule booking (update date/time only)
public Booking rescheduleBooking(String bookingId, String newDate, String newStartTime, String newEndTime, String userId, boolean isAdmin) {
    BookingUpdateRequestDTO updateRequest = new BookingUpdateRequestDTO();
    updateRequest.setDate(LocalDate.parse(newDate));
    updateRequest.setStartTime(LocalTime.parse(newStartTime));
    updateRequest.setEndTime(LocalTime.parse(newEndTime));
    
    return updateBooking(bookingId, updateRequest, userId, isAdmin);
}

// Update only purpose and attendees
public Booking updateBookingDetails(String bookingId, String purpose, Integer expectedAttendees, String userId, boolean isAdmin) {
    BookingUpdateRequestDTO updateRequest = new BookingUpdateRequestDTO();
    updateRequest.setPurpose(purpose);
    updateRequest.setExpectedAttendees(expectedAttendees);
    
    return partialUpdateBooking(bookingId, updateRequest, userId, isAdmin);
}

// Hard delete (remove from database)
public void permanentDeleteBooking(String bookingId) {
    Booking booking = getBookingOrThrow(bookingId);
    bookingRepository.delete(booking);
}

// Delete all bookings for a user
public void deleteAllUserBookings(String userId) {
    List<Booking> userBookings = bookingRepository.findByUserId(userId);
    bookingRepository.deleteAll(userBookings);
}

// Delete all cancelled bookings (cleanup)
public int deleteAllCancelledBookings() {
    List<Booking> cancelledBookings = bookingRepository.findByStatus(Booking.BookingStatus.CANCELLED);
    int count = cancelledBookings.size();
    bookingRepository.deleteAll(cancelledBookings);
    return count;
}

// Get bookings with advanced filters
public List<Booking> getAllBookings(String status, String resourceId, String userId, String startDate, String endDate) {
    // Build dynamic query based on provided filters
    if (status != null && resourceId != null && userId != null) {
        // Complex filtering - you may need to implement custom query
        return bookingRepository.findByStatusAndResourceIdAndUserId(Booking.BookingStatus.valueOf(status), resourceId, userId);
    } else if (status != null && resourceId != null) {
        return bookingRepository.findByResourceIdAndStatus(resourceId, Booking.BookingStatus.valueOf(status));
    } else if (status != null && userId != null) {
        return bookingRepository.findByUserIdAndStatus(userId, Booking.BookingStatus.valueOf(status));
    } else if (resourceId != null && userId != null) {
        return bookingRepository.findByResourceIdAndUserId(resourceId, userId);
    } else if (status != null) {
        return bookingRepository.findByStatus(Booking.BookingStatus.valueOf(status));
    } else if (resourceId != null) {
        return bookingRepository.findByResourceId(resourceId);
    } else if (userId != null) {
        return bookingRepository.findByUserId(userId);
    } else if (startDate != null && endDate != null) {
        return bookingRepository.findByDateBetween(LocalDate.parse(startDate), LocalDate.parse(endDate));
    } else {
        return bookingRepository.findAll();
    }
}

// Get bookings by date range with authorization
public List<Booking> getBookingsByDateRange(String startDate, String endDate, String userId, boolean isAdmin) {
    List<Booking> bookings = bookingRepository.findByDateBetween(
        LocalDate.parse(startDate), 
        LocalDate.parse(endDate)
    );
    
    if (!isAdmin) {
        bookings = bookings.stream()
            .filter(b -> b.getUserId().equals(userId))
            .collect(Collectors.toList());
    }
    
    return bookings;
}
        
// ===== NEW: Check availability for a specific time slot =====
    public boolean checkAvailability(String resourceId, String date, String startTime, String endTime) {
        LocalDate bookingDate = LocalDate.parse(date);
        LocalTime start = LocalTime.parse(startTime);
        LocalTime end = LocalTime.parse(endTime);
        
        // Check if resource exists
        Resource resource = resourceRepository.findById(resourceId)
            .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));
        
        // Check if resource is active
        if (!Resource.ResourceStatus.ACTIVE.equals(resource.getStatus())) {
            return false;
        }
        
        // Check for conflicting bookings
        List<Booking> conflicts = bookingRepository.findConflictingBookings(
            resourceId, bookingDate, start, end
        );
        
        return conflicts.isEmpty();
    }
    
    // ===== NEW: Get available time slots for a resource on a specific date =====
    public List<String> getAvailableTimeSlots(String resourceId, String date) {
        LocalDate bookingDate = LocalDate.parse(date);
        
        // Define working hours (customize as needed)
        LocalTime startHour = LocalTime.of(8, 0);  // 8:00 AM
        LocalTime endHour = LocalTime.of(20, 0);   // 8:00 PM
        int slotDuration = 60; // 60 minutes slots
        
        // Get all bookings for this resource on this date
        List<Booking> existingBookings = bookingRepository.findByResourceIdAndDate(resourceId, bookingDate);
        
        // Filter only approved and pending bookings
        List<Booking> activeBookings = existingBookings.stream()
            .filter(b -> Booking.BookingStatus.APPROVED.equals(b.getStatus()) || Booking.BookingStatus.PENDING.equals(b.getStatus()))
            .collect(Collectors.toList());
        
        // Generate all possible time slots
        List<String> availableSlots = new ArrayList<>();
        LocalTime currentSlot = startHour;
        
        while (currentSlot.plusMinutes(slotDuration).compareTo(endHour) <= 0) {
            LocalTime slotEnd = currentSlot.plusMinutes(slotDuration);
            boolean isAvailable = true;
            
            // Check if slot conflicts with existing bookings
            for (Booking booking : activeBookings) {
                if (!(slotEnd.compareTo(booking.getStartTime()) <= 0 || 
                      currentSlot.compareTo(booking.getEndTime()) >= 0)) {
                    isAvailable = false;
                    break;
                }
            }
            
            if (isAvailable) {
                availableSlots.add(String.format("%s - %s", 
                    currentSlot.format(DateTimeFormatter.ofPattern("HH:mm")),
                    slotEnd.format(DateTimeFormatter.ofPattern("HH:mm"))));
            }
            
            currentSlot = currentSlot.plusMinutes(slotDuration);
        }
        
        return availableSlots;
    }
    
    // ===== NEW: Get all bookings for a resource on a specific date =====
    public List<Booking> getResourceBookings(String resourceId, String date) {
        LocalDate bookingDate = LocalDate.parse(date);
        
        // Verify resource exists
        resourceRepository.findById(resourceId)
            .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));
        
        return bookingRepository.findByResourceIdAndDate(resourceId, bookingDate);
    }
    
    // ===== NEW: Get available resources based on criteria =====
    public List<Resource> getAvailableResources(String type, Integer minCapacity, String date, String startTime, String endTime) {
        LocalDate bookingDate = LocalDate.parse(date);
        LocalTime start = LocalTime.parse(startTime);
        LocalTime end = LocalTime.parse(endTime);
        
        // Get all active resources
        List<Resource> allResources = resourceRepository.findByStatus(Resource.ResourceStatus.ACTIVE);
        
        // Filter by type if specified
        if (type != null && !type.isEmpty()) {
            allResources = allResources.stream()
                .filter(r -> r.getType().name().equals(type))
                .collect(Collectors.toList());
        }
        
        // Filter by capacity if specified
        if (minCapacity != null && minCapacity > 0) {
            allResources = allResources.stream()
                .filter(r -> r.getCapacity() >= minCapacity)
                .collect(Collectors.toList());
        }
        
        // Check availability for each resource
        List<Resource> availableResources = new ArrayList<>();
        for (Resource resource : allResources) {
            List<Booking> conflicts = bookingRepository.findConflictingBookings(
                resource.getId(), bookingDate, start, end
            );
            if (conflicts.isEmpty()) {
                availableResources.add(resource);
            }
        }
        
        return availableResources;
    }
    
    // ===== NEW: Get booking statistics (admin only) =====
    public Map<String, Object> getBookingStatistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalBookings", bookingRepository.count());
        stats.put("pendingBookings", bookingRepository.findByStatus(Booking.BookingStatus.PENDING).size());
        stats.put("approvedBookings", bookingRepository.findByStatus(Booking.BookingStatus.APPROVED).size());
        stats.put("rejectedBookings", bookingRepository.findByStatus(Booking.BookingStatus.REJECTED).size());
        stats.put("cancelledBookings", bookingRepository.findByStatus(Booking.BookingStatus.CANCELLED).size());
        return stats;
    }
    
    // ===== NEW: Get bookings with pagination and advanced filtering (admin only) =====
    public Map<String, Object> getPaginatedBookings(
            int page, int size, String sortBy, String sortDir, 
            String status, String resourceId, String userId, String startDate, String endDate) {
        
        Map<String, Object> result = new HashMap<>();
        List<Booking> bookings = getAllBookings(status, resourceId, userId, startDate, endDate);
        
        // Simple pagination (you might want to implement proper pagination with Spring Data)
        int startIndex = page * size;
        int endIndex = Math.min(startIndex + size, bookings.size());
        
        List<Booking> paginatedBookings = bookings.subList(startIndex, endIndex);
        List<BookingResponseDTO> response = paginatedBookings.stream()
                .map(BookingResponseDTO::fromBooking)
                .collect(Collectors.toList());
        
        result.put("bookings", response);
        result.put("currentPage", page);
        result.put("totalItems", bookings.size());
        result.put("totalPages", (int) Math.ceil((double) bookings.size() / size));
        
        return result;
    }
    
    // ===== NEW: Bulk update booking status (admin only) =====
    public Map<String, Object> bulkUpdateBookingStatus(
            List<String> bookingIds, String status, String reason, String adminId) {
        
        Map<String, Object> result = new HashMap<>();
        int successCount = 0;
        int failureCount = 0;
        List<String> failedBookings = new ArrayList<>();
        
        for (String bookingId : bookingIds) {
            try {
                if ("APPROVED".equals(status)) {
                    approveBooking(bookingId, reason, adminId);
                } else if ("REJECTED".equals(status)) {
                    rejectBooking(bookingId, reason, adminId);
                } else {
                    throw new IllegalArgumentException("Invalid status: " + status);
                }
                successCount++;
            } catch (Exception e) {
                failureCount++;
                failedBookings.add(bookingId);
            }
        }
        
        result.put("successCount", successCount);
        result.put("failureCount", failureCount);
        result.put("failedBookings", failedBookings);
        
        return result;
    }
    
    // ===== NEW: Get booking conflicts report (admin only) =====
    public List<Map<String, Object>> getBookingConflicts(String startDate, String endDate) {
        List<Map<String, Object>> conflicts = new ArrayList<>();
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        
        // Get all bookings in the date range
        List<Booking> bookings = bookingRepository.findByDateBetween(start, end);
        
        // Check for conflicts (simplified approach)
        for (int i = 0; i < bookings.size(); i++) {
            for (int j = i + 1; j < bookings.size(); j++) {
                Booking b1 = bookings.get(i);
                Booking b2 = bookings.get(j);
                
                if (b1.getResourceId().equals(b2.getResourceId()) && 
                    b1.getDate().equals(b2.getDate()) &&
                    isTimeOverlap(b1.getStartTime(), b1.getEndTime(), b2.getStartTime(), b2.getEndTime())) {
                    
                    Map<String, Object> conflict = new HashMap<>();
                    conflict.put("resourceId", b1.getResourceId());
                    conflict.put("date", b1.getDate());
                    conflict.put("booking1", b1.getId());
                    conflict.put("booking2", b2.getId());
                    conflict.put("timeSlot1", b1.getStartTime() + " - " + b1.getEndTime());
                    conflict.put("timeSlot2", b2.getStartTime() + " - " + b2.getEndTime());
                    
                    conflicts.add(conflict);
                }
            }
        }
        
        return conflicts;
    }
    
    // Helper method to check time overlap
    private boolean isTimeOverlap(LocalTime start1, LocalTime end1, LocalTime start2, LocalTime end2) {
        return start1.isBefore(end2) && start2.isBefore(end1);
    }
    
    // ===== NEW: Export bookings to CSV (admin only) =====
    public byte[] exportBookingsToCsv(String status, String startDate, String endDate) throws Exception {
        List<Booking> bookings = getAllBookings(status, null, null, startDate, endDate);
        
        StringBuilder csv = new StringBuilder();
        csv.append("ID,User ID,Resource ID,Resource Name,Date,Start Time,End Time,Purpose,Status,Created At\n");
        
        for (Booking booking : bookings) {
            csv.append(booking.getId()).append(",")
               .append(booking.getUserId()).append(",")
               .append(booking.getResourceId()).append(",")
               .append(booking.getResourceName()).append(",")
               .append(booking.getDate()).append(",")
               .append(booking.getStartTime()).append(",")
               .append(booking.getEndTime()).append(",")
               .append(booking.getPurpose()).append(",")
               .append(booking.getStatus()).append(",")
               .append(booking.getCreatedAt()).append("\n");
        }
        
        return csv.toString().getBytes("UTF-8");
    }
    
    // ===== NEW: Get resource utilization report (admin only) =====
    public Map<String, Object> getResourceUtilizationReport(String startDate, String endDate) {
        Map<String, Object> report = new HashMap<>();
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        
        List<Booking> bookings = bookingRepository.findByDateBetween(start, end);
        Map<String, Long> resourceUsage = new HashMap<>();
        
        for (Booking booking : bookings) {
            if (Booking.BookingStatus.APPROVED.equals(booking.getStatus())) {
                resourceUsage.merge(booking.getResourceId(), 1L, Long::sum);
            }
        }
        
        report.put("totalBookings", bookings.size());
        report.put("approvedBookings", bookings.stream().filter(b -> Booking.BookingStatus.APPROVED.equals(b.getStatus())).count());
        report.put("resourceUsage", resourceUsage);
        
        return report;
    }
    
    // ===== NEW: Get user booking history (admin only) =====
    public Map<String, Object> getUserBookingHistory(String userId, int page, int size) {
        Map<String, Object> history = new HashMap<>();
        List<Booking> userBookings = bookingRepository.findByUserId(userId);
        
        // Simple pagination
        int startIndex = page * size;
        int endIndex = Math.min(startIndex + size, userBookings.size());
        
        List<Booking> paginatedBookings = userBookings.subList(startIndex, endIndex);
        List<BookingResponseDTO> response = paginatedBookings.stream()
                .map(BookingResponseDTO::fromBooking)
                .collect(Collectors.toList());
        
        history.put("bookings", response);
        history.put("currentPage", page);
        history.put("totalItems", userBookings.size());
        history.put("totalPages", (int) Math.ceil((double) userBookings.size() / size));
        
        return history;
    }
    
    // ===== NEW: Create recurring bookings (admin only) =====
    public Map<String, Object> createRecurringBookings(Map<String, Object> request, String adminId) {
        Map<String, Object> result = new HashMap<>();
        
        @SuppressWarnings("unchecked")
        List<BookingRequestDTO> bookingRequests = (List<BookingRequestDTO>) request.get("bookings");
        
        List<Booking> createdBookings = new ArrayList<>();
        List<String> failedBookings = new ArrayList<>();
        
        for (BookingRequestDTO bookingRequest : bookingRequests) {
            try {
                Booking booking = createBooking(bookingRequest, adminId);
                createdBookings.add(booking);
            } catch (Exception e) {
                failedBookings.add(bookingRequest.getResourceId() + " on " + bookingRequest.getDate());
            }
        }
        
        result.put("successCount", createdBookings.size());
        result.put("failureCount", failedBookings.size());
        result.put("createdBookings", createdBookings.stream()
                .map(BookingResponseDTO::fromBooking)
                .collect(Collectors.toList()));
        result.put("failedBookings", failedBookings);
        
        return result;
    }

}
