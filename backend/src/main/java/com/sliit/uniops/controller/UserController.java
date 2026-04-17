package com.sliit.uniops.controller;

import com.sliit.uniops.model.Role;
import com.sliit.uniops.model.User;
import com.sliit.uniops.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Controller for user-related operations.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    /**
     * Get the currently logged-in user's profile info.
     */
    @GetMapping("/auth/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }
        return ResponseEntity.ok(user);
    }

    /**
     * List all users (Admin only).
     */
    @GetMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    /**
     * Update a user's roles (Admin only).
     */
    @PutMapping("/admin/users/{userId}/roles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUserRoles(@PathVariable String userId, @RequestBody Map<String, List<String>> roleRequest) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<String> roleNames = roleRequest.get("roles");
        if (roleNames == null) {
            return ResponseEntity.badRequest().body("Roles list is required");
        }
        
        Set<Role> roles = roleNames.stream()
                .map(Role::valueOf)
                .collect(Collectors.toSet());
        
        user.setRoles(roles);
        userRepository.save(user);
        
        return ResponseEntity.ok(user);
    }

    /**
     * Update user status (Admin only).
     */
    @PutMapping("/admin/users/{userId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUserStatus(@PathVariable String userId, @RequestBody Map<String, Boolean> statusRequest) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Boolean enabled = statusRequest.get("enabled");
        if (enabled == null) {
            return ResponseEntity.badRequest().body("Enabled status is required");
        }
        
        user.setEnabled(enabled);
        userRepository.save(user);
        
        return ResponseEntity.ok(user);
    }
}
