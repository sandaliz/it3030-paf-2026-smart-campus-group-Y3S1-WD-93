package com.sliit.uniops.service;

import com.sliit.uniops.model.Booking;
import com.sliit.uniops.model.Resource;
import com.sliit.uniops.model.User;
import com.sliit.uniops.repository.BookingRepository;
import com.sliit.uniops.repository.ResourceRepository;
import com.sliit.uniops.repository.UserRepository;
import com.sliit.uniops.dto.request.BookingRequestDTO;
import com.sliit.uniops.dto.request.BookingUpdateRequestDTO;
import com.sliit.uniops.exception.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for handling booking operations.
 */
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final BookingNotificationService notificationService;
    private final UserRepository userRepository;
    private final EmailService emailService;
    
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
        booking.setResourceType(resource.getType().toString());
        booking.setDate(request.getDate());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setPurpose(request.getPurpose());
        booking.setExpectedAttendees(request.getExpectedAttendees());
        booking.setStatus("PENDING");
        
        Booking savedBooking = bookingRepository.save(booking);
        
        // 4. Send email notification to booking management admin
        try {
            User user = userRepository.findById(userId).orElse(null);
            String requestedBy = user != null ? user.getName() : "Unknown User";
            
            emailService.sendBookingManagementNotification(
                savedBooking.getId(),
                resource.getName(),
                request.getDate().toString(),
                request.getStartTime().toString(),
                request.getEndTime().toString(),
                requestedBy
            );
        } catch (Exception e) {
            // Log error but don't fail the booking creation
            System.err.println("Failed to send booking management notification: " + e.getMessage());
        }
        
        return savedBooking;
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

    // Get bookings by resource ID (for tracking)
    public List<Booking> getBookingsByResourceId(String resourceId) {
        return bookingRepository.findByResourceId(resourceId);
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

    public Booking save(Booking booking) {
        booking.setUpdatedAt(LocalDateTime.now());
        return bookingRepository.save(booking);
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
            
            notificationService.sendBookingRejectedNotification(
                booking.getUserId(),
                bookingId,
                booking.getResourceName(),
                "Auto-rejected: New conflict detected during approval"
            );
            
            throw new BookingConflictException("New conflict detected. Booking auto-rejected.");
        }
        
        booking.setStatus("APPROVED");
        Booking approvedBooking = bookingRepository.save(booking);
        
        notificationService.sendBookingApprovedNotification(
            booking.getUserId(),
            bookingId,
            booking.getResourceName()
        );

        sendBookingStatusEmail(approvedBooking, "APPROVED", adminId, reason);
        
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
        
        notificationService.sendBookingRejectedNotification(
            booking.getUserId(),
            bookingId,
            booking.getResourceName(),
            reason
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
        booking.setResourceType(newResource.getType().toString());
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
    List<Booking> bookings = bookingRepository.findAll();

    if (status != null && !status.isBlank()) {
        bookings = bookings.stream()
            .filter(booking -> status.equals(booking.getStatus()))
            .collect(Collectors.toList());
    }

    if (resourceId != null && !resourceId.isBlank()) {
        bookings = bookings.stream()
            .filter(booking -> resourceId.equals(booking.getResourceId()))
            .collect(Collectors.toList());
    }

    if (userId != null && !userId.isBlank()) {
        bookings = bookings.stream()
            .filter(booking -> userId.equals(booking.getUserId()))
            .collect(Collectors.toList());
    }

    if (startDate != null && !startDate.isBlank() && endDate != null && !endDate.isBlank()) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        bookings = bookings.stream()
            .filter(booking -> booking.getDate() != null
                && !booking.getDate().isBefore(start)
                && !booking.getDate().isAfter(end))
            .collect(Collectors.toList());
    }

    return bookings;
}

public Map<String, Object> getBookingStatistics() {
    List<Booking> bookings = bookingRepository.findAll();
    Map<String, Long> countsByStatus = bookings.stream()
        .collect(Collectors.groupingBy(Booking::getStatus, Collectors.counting()));

    Map<String, Object> stats = new HashMap<>();
    stats.put("total", bookings.size());
    stats.put("pending", countsByStatus.getOrDefault("PENDING", 0L));
    stats.put("approved", countsByStatus.getOrDefault("APPROVED", 0L));
    stats.put("rejected", countsByStatus.getOrDefault("REJECTED", 0L));
    stats.put("cancelled", countsByStatus.getOrDefault("CANCELLED", 0L));
    return stats;
}

public Map<String, Object> getPaginatedBookings(int page, int size, String status, String resourceId, String userId, String startDate, String endDate) {
    List<Booking> filtered = getAllBookings(status, resourceId, userId, startDate, endDate).stream()
        .sorted(Comparator.comparing(Booking::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
        .collect(Collectors.toList());

    int startIndex = Math.max(0, page * size);
    int endIndex = Math.min(filtered.size(), startIndex + size);
    List<Booking> pageContent = startIndex >= filtered.size() ? new ArrayList<>() : filtered.subList(startIndex, endIndex);

    Map<String, Object> response = new HashMap<>();
    response.put("content", pageContent);
    response.put("totalElements", filtered.size());
    response.put("totalPages", size <= 0 ? 1 : (int) Math.ceil((double) filtered.size() / size));
    response.put("size", size);
    response.put("number", page);
    return response;
}

public List<Booking> bulkUpdateBookingStatus(List<String> bookingIds, String status, String reason, String adminId) {
    List<Booking> updatedBookings = new ArrayList<>();
    for (String bookingId : bookingIds) {
        if ("APPROVED".equals(status)) {
            updatedBookings.add(approveBooking(bookingId, reason, adminId));
        } else if ("REJECTED".equals(status)) {
            updatedBookings.add(rejectBooking(bookingId, reason, adminId));
        }
    }
    return updatedBookings;
}

public List<Map<String, Object>> getBookingConflicts(String startDate, String endDate) {
    List<Booking> bookings = getAllBookings(null, null, null, startDate, endDate).stream()
        .filter(booking -> "APPROVED".equals(booking.getStatus()) || "PENDING".equals(booking.getStatus()))
        .collect(Collectors.toList());

    List<Map<String, Object>> conflicts = new ArrayList<>();
    for (int i = 0; i < bookings.size(); i++) {
        for (int j = i + 1; j < bookings.size(); j++) {
            Booking first = bookings.get(i);
            Booking second = bookings.get(j);
            if (!first.getResourceId().equals(second.getResourceId()) || !first.getDate().equals(second.getDate())) {
                continue;
            }
            boolean overlaps = !(first.getEndTime().compareTo(second.getStartTime()) <= 0
                || first.getStartTime().compareTo(second.getEndTime()) >= 0);
            if (overlaps) {
                Map<String, Object> conflictMap = new HashMap<>();
                conflictMap.put("resourceId", first.getResourceId());
                conflictMap.put("resourceName", first.getResourceName());
                conflictMap.put("date", first.getDate().toString());
                conflictMap.put("bookingIds", List.of(first.getId(), second.getId()));
                conflicts.add(conflictMap);
            }
        }
    }
    return conflicts;
}

public List<Map<String, Object>> getResourceUtilization(String startDate, String endDate) {
    List<Booking> bookings = getAllBookings("APPROVED", null, null, startDate, endDate);
    return bookings.stream()
        .collect(Collectors.groupingBy(Booking::getResourceId))
        .entrySet()
        .stream()
        .map(entry -> {
            Booking sample = entry.getValue().get(0);
            long totalHours = entry.getValue().stream()
                .mapToLong(booking -> java.time.Duration.between(booking.getStartTime(), booking.getEndTime()).toHours())
                .sum();
            Map<String, Object> utilizationMap = new HashMap<>();
            utilizationMap.put("resourceId", entry.getKey());
            utilizationMap.put("resourceName", sample.getResourceName());
            utilizationMap.put("bookingCount", entry.getValue().size());
            utilizationMap.put("scheduledHours", totalHours);
            return utilizationMap;
        })
        .collect(Collectors.toList());
}

public Map<String, Object> getUserBookingHistory(String userId, int page, int size) {
    List<Booking> bookings = bookingRepository.findByUserId(userId).stream()
        .sorted(Comparator.comparing(Booking::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
        .collect(Collectors.toList());

    int startIndex = Math.max(0, page * size);
    int endIndex = Math.min(bookings.size(), startIndex + size);
    List<Booking> pageContent = startIndex >= bookings.size() ? new ArrayList<>() : bookings.subList(startIndex, endIndex);

    Map<String, Object> response = new HashMap<>();
    response.put("content", pageContent);
    response.put("totalElements", bookings.size());
    response.put("totalPages", size <= 0 ? 1 : (int) Math.ceil((double) bookings.size() / size));
    response.put("size", size);
    response.put("number", page);
    return response;
}

public List<Booking> createRecurringBookings(List<BookingRequestDTO> requests, String userId) {
    return createMultipleBookings(requests, userId);
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
        List<Resource> allResources = resourceRepository.findAll().stream()
            .filter(resource -> Resource.ResourceStatus.ACTIVE.equals(resource.getStatus()))
            .collect(Collectors.toList());
        
        // Filter by type if specified
        if (type != null && !type.isEmpty()) {
            allResources = allResources.stream()
                .filter(r -> r.getType() != null && r.getType().name().equalsIgnoreCase(type))
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

    private void sendBookingStatusEmail(Booking booking, String status, String adminId, String reason) {
        userRepository.findById(booking.getUserId()).ifPresent(user -> {
            if (user.getEmail() == null || user.getEmail().isBlank()) {
                return;
            }

            emailService.sendBookingStatusUpdateNotification(
                user.getEmail(),
                resolveUserDisplayName(user),
                booking.getId(),
                booking.getResourceName(),
                booking.getDate() != null ? booking.getDate().toString() : "-",
                booking.getStartTime() != null ? booking.getStartTime().toString() : "-",
                booking.getEndTime() != null ? booking.getEndTime().toString() : "-",
                status,
                resolveAdminLabel(adminId),
                reason
            );
        });
    }

    private String resolveAdminLabel(String adminId) {
        if (adminId == null || adminId.isBlank()) {
            return "Admin";
        }

        return userRepository.findById(adminId)
            .map(this::resolveUserDisplayName)
            .orElse("Admin");
    }

    private String resolveUserDisplayName(User user) {
        if (user.getName() != null && !user.getName().isBlank()) {
            return user.getName();
        }

        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            return user.getEmail();
        }

        return "User";
    }

    // Generate CSV report for bookings
    public byte[] generateBookingReport(List<Booking> bookings) {
        StringBuilder csvContent = new StringBuilder();
        
        // CSV Header
        csvContent.append("Booking ID,Resource Name,Resource Type,User ID,Date,Start Time,End Time,Purpose,Expected Attendees,Status,Created At,Updated At\n");
        
        // CSV Data
        for (Booking booking : bookings) {
            csvContent.append(escapeCsvField(booking.getId())).append(",");
            csvContent.append(escapeCsvField(booking.getResourceName())).append(",");
            csvContent.append(escapeCsvField(booking.getResourceType())).append(",");
            csvContent.append(escapeCsvField(booking.getUserId())).append(",");
            csvContent.append(escapeCsvField(booking.getDate() != null ? booking.getDate().toString() : "")).append(",");
            csvContent.append(escapeCsvField(booking.getStartTime() != null ? booking.getStartTime().toString() : "")).append(",");
            csvContent.append(escapeCsvField(booking.getEndTime() != null ? booking.getEndTime().toString() : "")).append(",");
            csvContent.append(escapeCsvField(booking.getPurpose())).append(",");
            csvContent.append(booking.getExpectedAttendees() != null ? booking.getExpectedAttendees() : "").append(",");
            csvContent.append(escapeCsvField(booking.getStatus())).append(",");
            csvContent.append(escapeCsvField(booking.getCreatedAt() != null ? booking.getCreatedAt().toString() : "")).append(",");
            csvContent.append(escapeCsvField(booking.getUpdatedAt() != null ? booking.getUpdatedAt().toString() : ""));
            csvContent.append("\n");
        }
        
        return csvContent.toString().getBytes();
    }
    
    // Helper method to escape CSV fields
    private String escapeCsvField(String field) {
        if (field == null) {
            return "";
        }
        
        // If field contains comma, quote, or newline, wrap in quotes and escape quotes
        if (field.contains(",") || field.contains("\"") || field.contains("\n")) {
            return "\"" + field.replace("\"", "\"\"") + "\"";
        }
        
        return field;
    }

    // Get alternative resource suggestions when requested resource is unavailable
    public List<Resource> getAlternativeResources(String unavailableResourceId, String date, String startTime, String endTime, Integer minCapacity) {
        // Get the unavailable resource to find similar ones
        Resource unavailableResource = resourceRepository.findById(unavailableResourceId)
            .orElseThrow(() -> new ResourceNotFoundException("Resource not found with ID: " + unavailableResourceId));
        
        // Get all active resources except the unavailable one
        List<Resource> allActiveResources = resourceRepository.findAll().stream()
            .filter(resource -> Resource.ResourceStatus.ACTIVE.equals(resource.getStatus()))
            .filter(resource -> !resource.getId().equals(unavailableResourceId))
            .collect(Collectors.toList());
        
        // Filter resources that are available at the requested time
        List<Resource> availableAlternatives = new ArrayList<>();
        
        for (Resource resource : allActiveResources) {
            // Check capacity requirement
            if (minCapacity != null && resource.getCapacity() < minCapacity) {
                continue;
            }
            
            // Check if resource is available at the requested time
            List<Booking> conflicts = bookingRepository.findConflictingBookings(
                resource.getId(),
                LocalDate.parse(date),
                LocalTime.parse(startTime),
                LocalTime.parse(endTime)
            );
            
            if (conflicts.isEmpty()) {
                availableAlternatives.add(resource);
            }
        }
        
        // Sort by similarity to the original resource (same type first, then by capacity)
        availableAlternatives.sort((r1, r2) -> {
            // Same type gets priority
            if (r1.getType() == unavailableResource.getType() && r2.getType() != unavailableResource.getType()) {
                return -1;
            }
            if (r1.getType() != unavailableResource.getType() && r2.getType() == unavailableResource.getType()) {
                return 1;
            }
            
            // Then sort by capacity (closest to original capacity first)
            int capacityDiff1 = Math.abs(r1.getCapacity() - unavailableResource.getCapacity());
            int capacityDiff2 = Math.abs(r2.getCapacity() - unavailableResource.getCapacity());
            return Integer.compare(capacityDiff1, capacityDiff2);
        });
        
        // Return top 5 alternatives
        return availableAlternatives.stream()
            .limit(5)
            .collect(Collectors.toList());
    }

}
