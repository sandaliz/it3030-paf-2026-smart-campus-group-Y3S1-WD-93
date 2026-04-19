package com.sliit.uniops.controller;

import com.sliit.uniops.model.Role;
import com.sliit.uniops.model.User;
import com.sliit.uniops.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Controller for managing technicians from database
 */
@RestController
@RequestMapping("/api/technicians")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class TechnicianController {

    private final UserRepository userRepository;

    /**
     * Get all active technicians from database
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllTechnicians() {
        List<User> technicians = userRepository.findAll().stream()
                .filter(user -> user.isEnabled() && user.getRoles().contains(Role.TECHNICIAN))
                .collect(Collectors.toList());
        return ResponseEntity.ok(technicians);
    }

    /**
     * Get technician by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> getTechnicianById(@PathVariable String id) {
        User technician = userRepository.findById(id)
                .filter(user -> user.isEnabled() && user.getRoles().contains(Role.TECHNICIAN))
                .orElseThrow(() -> new RuntimeException("Technician not found with ID: " + id));
        return ResponseEntity.ok(technician);
    }

    /**
     * Update technician skills
     */
    @PutMapping("/{id}/skills")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> updateTechnicianSkills(
            @PathVariable String id,
            @RequestBody java.util.Set<String> skills) {
        
        User technician = userRepository.findById(id)
                .filter(user -> user.isEnabled() && user.getRoles().contains(Role.TECHNICIAN))
                .orElseThrow(() -> new RuntimeException("Technician not found with ID: " + id));
        
        technician.setTechnicianSkills(skills);
        User updatedTechnician = userRepository.save(technician);
        return ResponseEntity.ok(updatedTechnician);
    }
}
