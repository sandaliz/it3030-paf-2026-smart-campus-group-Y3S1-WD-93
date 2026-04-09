package com.sliit.uniops.model;

/**
 * Defines the roles available in the Smart Campus system.
 * These roles determine what data a user can access and what actions they can perform.
 */
public enum Role {
    ADMIN,          // Full access to manage resources, bookings, and users
    STUDENT,        // Can create bookings and tickets
    LECTURER,       // Can create bookings and tickets (extended capacity potentially)
    STAFF,          // Non-academic staff
    TECHNICIAN,     // Assigned to maintenance tickets
    USER            // Default base role
}
