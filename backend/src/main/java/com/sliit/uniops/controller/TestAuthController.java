package com.sliit.uniops.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller to test role-based access control.
 */
@RestController
@RequestMapping("/api/test")
public class TestAuthController {

    @GetMapping("/public")
    public String publicAccess() {
        return "Public Content - Anyone can see this.";
    }

    @GetMapping("/user")
    @PreAuthorize("hasAnyRole('USER', 'STUDENT', 'LECTURER', 'STAFF', 'TECHNICIAN', 'ADMIN')")
    public String userAccess() {
        return "User Content - Any authenticated user can see this.";
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public String adminAccess() {
        return "Admin Content - Only ADMIN can see this.";
    }

    @GetMapping("/technician")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public String technicianAccess() {
        return "Technician Content - Only TECHNICIAN can see this.";
    }
}
