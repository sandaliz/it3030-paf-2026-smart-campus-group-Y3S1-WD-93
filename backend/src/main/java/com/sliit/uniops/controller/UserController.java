package com.sliit.uniops.controller;

import com.sliit.uniops.model.Role;
import com.sliit.uniops.model.User;
import com.sliit.uniops.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.LinkedHashSet;
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
    private final PasswordEncoder passwordEncoder;

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
                .map(this::parseRoleName)
                .collect(Collectors.toSet());
        
        user.setRoles(roles);
        if (roleRequest.containsKey("technicianSkills")) {
            user.setTechnicianSkills(normalizeSkills(roleRequest.get("technicianSkills")));
        }
        userRepository.save(user);
        
        return ResponseEntity.ok(user);
    }

    /**
     * Create a new user (Admin only).
     */
    @PostMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> userRequest) {
        String email = ((String) userRequest.get("email"));
        String name = ((String) userRequest.get("name"));
        String password = ((String) userRequest.get("password"));
        @SuppressWarnings("unchecked")
        List<String> roleNames = (List<String>) userRequest.get("roles");
        @SuppressWarnings("unchecked")
        List<String> technicianSkills = (List<String>) userRequest.get("technicianSkills");
        Boolean enabled = (Boolean) userRequest.getOrDefault("enabled", true);
        
        if (email == null || name == null) {
            return ResponseEntity.badRequest().body("Email and name are required");
        }

        if (password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body("Password is required");
        }

        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        
        // Check if user already exists
        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            return ResponseEntity.badRequest().body("User with this email already exists");
        }
        
        Set<Role> roles = roleNames != null ?
            roleNames.stream().map(this::parseRoleName).collect(Collectors.toSet()) :
            Set.of(Role.STUDENT);
        
        User user = User.builder()
                .email(normalizedEmail)
                .username(generateUsernameFromEmail(email))
                .name(name)
                .password(passwordEncoder.encode(password))
                .authProvider("LOCAL")
                .roles(roles)
                .technicianSkills(normalizeSkills(technicianSkills))
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
                .filter(user -> user.isEnabled() && user.getRoles().contains(com.sliit.uniops.model.Role.TECHNICIAN))
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(technicians);
    }

    /**
     * Get all NON_ACADEMIC staff (for resource assignment).
     */
    @GetMapping("/admin/staff")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getStaff() {
        List<User> staff = userRepository.findAll().stream()
                .filter(user -> user.isEnabled() && user.getRoles().contains(com.sliit.uniops.model.Role.NON_ACADEMIC))
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(staff);
    }

    /**
     * Create a new technician (Admin only).
     */
    @PostMapping("/admin/technicians")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createTechnician(@RequestBody Map<String, Object> technicianRequest) {
        String email = ((String) technicianRequest.get("email"));
        String name = ((String) technicianRequest.get("name"));
        String password = ((String) technicianRequest.get("password"));
        @SuppressWarnings("unchecked")
        List<String> technicianSkills = (List<String>) technicianRequest.get("technicianSkills");
        Boolean enabled = (Boolean) technicianRequest.getOrDefault("enabled", true);
        
        if (email == null || name == null) {
            return ResponseEntity.badRequest().body("Email and name are required");
        }
        
        // Check if user already exists
        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body("User with this email already exists");
        }
        
        // Create technician with TECHNICIAN role
        User technician = User.builder()
                .email(email)
                .name(name)
                .username(generateUsernameFromEmail(email))
                .password(passwordEncoder.encode(password))
                .authProvider("LOCAL")
                .roles(Set.of(com.sliit.uniops.model.Role.TECHNICIAN))
                .technicianSkills(normalizeSkills(technicianSkills))
                .enabled(enabled)
                .createdAt(System.currentTimeMillis())
                .build();
        
        User savedTechnician = userRepository.save(technician);
        return ResponseEntity.ok(savedTechnician);
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

    private Set<String> normalizeSkills(List<String> skills) {
        if (skills == null) {
            return new LinkedHashSet<>();
        }

        return skills.stream()
                .filter(skill -> skill != null && !skill.isBlank())
                .map(skill -> skill.trim().toLowerCase(Locale.ROOT))
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private Role parseRoleName(String roleName) {
        if (roleName == null || roleName.isBlank()) {
            throw new IllegalArgumentException("Role name cannot be empty");
        }

        String normalizedRole = roleName.trim().toUpperCase(Locale.ROOT);
        if ("TECHNICIAN".equals(normalizedRole)) {
            normalizedRole = "TECHNICIAN";
        }

        return Role.valueOf(normalizedRole);
    }

    private String generateUsernameFromEmail(String email) {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        int atIndex = normalizedEmail.indexOf('@');
        String baseName = atIndex > 0 ? normalizedEmail.substring(0, atIndex) : normalizedEmail;
        String sanitized = baseName.replaceAll("[^a-z0-9._-]", "");

        if (sanitized.isBlank()) {
            sanitized = "user";
        }

        String candidate = sanitized;
        int suffix = 1;
        while (userRepository.existsByUsername(candidate)) {
            candidate = sanitized + suffix++;
        }
        return candidate;
    }
}
