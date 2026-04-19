package com.sliit.uniops.service;

import com.sliit.uniops.model.Role;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.Set;

/**
 * Service to handle role mapping from email suffixes and role priority logic.
 */
@Service
public class RoleMappingService {

    /**
     * Parses the role from the email suffix using the format: user+{role}@domain.com
     * @param email The user's email address
     * @return The determined Role, or STUDENT as default
     */
    public Role parseRoleFromEmail(String email) {
        if (email == null) return Role.STUDENT;
        
        String lowercaseEmail = email.toLowerCase();
        
        // Prioritize explicit suffixes first (e.g. +admin)
        // Then fallback to checking if the keyword exists anywhere in the local part
        if (lowercaseEmail.contains("admin")) {
            return Role.ADMIN;
        } else if (lowercaseEmail.contains("bookingmanager")) {
            return Role.BOOKING_MANAGER;
        } else if (lowercaseEmail.contains("ticketmanager") || lowercaseEmail.contains("tech")) {
            return Role.TECHNICIAN;
        } else if (lowercaseEmail.contains("resource")) {
            return Role.RESOURCE_MANAGER;
        } else if (lowercaseEmail.contains("lecturer")) {
            return Role.LECTURER;
        } else if (lowercaseEmail.contains("staff")) {
            return Role.NON_ACADEMIC;
        } else if (lowercaseEmail.contains("student")) {
            return Role.STUDENT;
        }
        
        return Role.STUDENT; // Final fallback
    }

    /**
     * Returns the role with the highest priority from a set of roles.
     */
    public Role getHighestPriorityRole(Set<Role> roles) {
        if (roles == null || roles.isEmpty()) {
            return Role.STUDENT;
        }
        return roles.stream()
                .max(Comparator.comparingInt(Role::getPriority))
                .orElse(Role.STUDENT);
    }

    /**
     * Returns the frontend dashboard path for a given role.
     */
    public String getDashboardPath(Role role) {
        switch (role) {
            case ADMIN: return "/admin/dashboard";
            case BOOKING_MANAGER: return "/admin/bookings";
            case RESOURCE_MANAGER: return "/admin/resources";
            case TICKET_MANAGER:
                return "/admin/tickets";
            case TECHNICIAN:
            case TECHINICIAN:
                return "/technician/dashboard";
            case LECTURER: return "/lecturer/dashboard";
            case NON_ACADEMIC: return "/staff/dashboard";
            case STUDENT:
            default: return "/student/dashboard";
        }
    }
}
