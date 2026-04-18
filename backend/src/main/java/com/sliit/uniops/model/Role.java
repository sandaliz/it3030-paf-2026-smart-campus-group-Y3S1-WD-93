package com.sliit.uniops.model;

/**
 * Defines the roles available in the Smart Campus system.
 * These roles determine what data a user can access and what actions they can perform.
 */
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Defines the roles available in the Smart Campus system.
 * These roles determine what data a user can access and what actions they can perform.
 */
@Getter
@RequiredArgsConstructor
public enum Role {
    ADMIN(10),               // Full access
    BOOKING_MANAGER(9),     // Manage space bookings
    TICKET_MANAGER(8),      // Manage support tickets
    RESOURCE_MANAGER(7),    // Manage physical resources
    LECTURER(6),            // Faculty access
    TECHNICIAN(5),          // Maintenance access
    NON_ACADEMIC(4),        // General staff
    USER(2),                // Generic end-user access for existing protected endpoints
    STUDENT(1);             // Default access

    private final int priority;
}
