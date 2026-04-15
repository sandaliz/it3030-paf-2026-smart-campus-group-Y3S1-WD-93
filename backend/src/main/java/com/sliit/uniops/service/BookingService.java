package com.sliit.uniops.service;

import com.sliit.uniops.model.Booking;
import com.sliit.uniops.model.Resource;
import com.sliit.uniops.repository.BookingRepository;
import com.sliit.uniops.repository.ResourceRepository;
import com.sliit.uniops.dto.request.BookingRequestDTO;
import com.sliit.uniops.dto.request.BookingUpdateRequestDTO;
import com.sliit.uniops.exception.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
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
        
        if (!"ACTIVE".equals(resource.getStatus())) {
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
        booking.setStatus("PENDING");
        
        return bookingRepository.save(booking);
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
    
    // Get all bookings (admin only) with filters
    public List<Booking> getAllBookings(String status, String resourceId) {
        if (status != null && resourceId != null) {
            return bookingRepository.findByResourceIdAndStatus(resourceId, status);
        } else if (status != null) {
            return bookingRepository.findByStatus(status);
        } else if (resourceId != null) {
            return bookingRepository.findByResourceId(resourceId);
        } else {
            return bookingRepository.findAll();
        }
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
        
        if (!"PENDING".equals(booking.getStatus())) {
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
            booking.setStatus("REJECTED");
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
        
        booking.setStatus("APPROVED");
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
        
        if (!"PENDING".equals(booking.getStatus())) {
            throw new InvalidBookingStateException(
                "Cannot reject booking with status: " + booking.getStatus()
            );
        }
        
        booking.setStatus("REJECTED");
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
        
        if (!"APPROVED".equals(booking.getStatus()) && !"PENDING".equals(booking.getStatus())) {
            throw new InvalidBookingStateException(
                "Cannot cancel booking with status: " + booking.getStatus()
            );
        }
        
        booking.setStatus("CANCELLED");
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
    if (!"PENDING".equals(booking.getStatus()) && !"APPROVED".equals(booking.getStatus())) {
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
    List<Booking> cancelledBookings = bookingRepository.findByStatus("CANCELLED");
    int count = cancelledBookings.size();
    bookingRepository.deleteAll(cancelledBookings);
    return count;
}

// Get bookings with advanced filters
public List<Booking> getAllBookings(String status, String resourceId, String userId, String startDate, String endDate) {
    // Build dynamic query based on provided filters
    if (status != null && resourceId != null && userId != null) {
        // Complex filtering - you may need to implement custom query
        return bookingRepository.findByStatusAndResourceIdAndUserId(status, resourceId, userId);
    } else if (status != null && resourceId != null) {
        return bookingRepository.findByResourceIdAndStatus(resourceId, status);
    } else if (status != null && userId != null) {
        return bookingRepository.findByUserIdAndStatus(userId, status);
    } else if (resourceId != null && userId != null) {
        return bookingRepository.findByResourceIdAndUserId(resourceId, userId);
    } else if (status != null) {
        return bookingRepository.findByStatus(status);
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
        if (!"ACTIVE".equals(resource.getStatus())) {
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
            .filter(b -> b.getStatus().equals("APPROVED") || b.getStatus().equals("PENDING"))
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
        List<Resource> allResources = resourceRepository.findByStatus("ACTIVE");
        
        // Filter by type if specified
        if (type != null && !type.isEmpty()) {
            allResources = allResources.stream()
                .filter(r -> r.getType().equals(type))
                .collect(Collectors.toList());
        }
        
        // Filter by capacity if specified
        if (minCapacity != null) {
            allResources = allResources.stream()
                .filter(r -> r.getCapacity() != null && r.getCapacity() >= minCapacity)
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

}
