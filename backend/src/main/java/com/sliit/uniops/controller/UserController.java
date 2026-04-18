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
     * Create a new user (Admin only).
     */
    @PostMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> userRequest) {
        String email = (String) userRequest.get("email");
        String name = (String) userRequest.get("name");
        @SuppressWarnings("unchecked")
        List<String> roleNames = (List<String>) userRequest.get("roles");
        Boolean enabled = (Boolean) userRequest.getOrDefault("enabled", true);
        
        if (email == null || name == null) {
            return ResponseEntity.badRequest().body("Email and name are required");
        }
        
        // Check if user already exists
        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body("User with this email already exists");
        }
        
        Set<Role> roles = roleNames != null ? 
            roleNames.stream().map(Role::valueOf).collect(Collectors.toSet()) :
            Set.of(Role.STUDENT);
        
        User user = User.builder()
                .email(email.toLowerCase().trim())
                .name(name)
                .roles(roles)
                .enabled(enabled)
                .createdAt(System.currentTimeMillis())
                .build();
        
        User savedUser = userRepository.save(user);
        return ResponseEntity.ok(savedUser);
    }

    /**
     * Delete a user (Admin only).
     */
    @DeleteMapping("/admin/users/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        userRepository.delete(user);
        return ResponseEntity.ok("User deleted successfully");
    }

    /**
     * Get all technicians (Admin and Technician roles).
     */
    @GetMapping("/admin/technicians")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getTechnicians() {
        List<User> technicians = userRepository.findAll().stream()
                .filter(user -> user.getRoles().contains(com.sliit.uniops.model.Role.TECHNICIAN))
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(technicians);
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
