package com.sliit.uniops.controller;

import com.sliit.uniops.model.Resource;
import com.sliit.uniops.model.Role;
import com.sliit.uniops.model.User;
import com.sliit.uniops.repository.UserRepository;
import com.sliit.uniops.service.ResourceService;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Data
@AllArgsConstructor
@NoArgsConstructor
class StaffResponse {
    private String id;
    private String username;
    private String name;
    private String email;
    private Set<String> roles;
    private boolean enabled;
}

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:3000"})
public class ResourceController {

    private final ResourceService resourceService;
    private final MongoTemplate mongoTemplate;
    
    // Get all resources (public)
    @GetMapping
    public ResponseEntity<List<Resource>> getAllResources() {
        return ResponseEntity.ok(resourceService.getAllResources());
    }
    
    // Get paginated resources
    @GetMapping("/paginated")
    public ResponseEntity<Object> getResourcesPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir) {
        return ResponseEntity.ok(resourceService.getResourcesPaginated(page, size, search, status, type, sortBy, sortDir));
    }
    
    // Get resource by ID
    @GetMapping("/{id}")
    public ResponseEntity<Resource> getResourceById(@PathVariable String id) {
        return ResponseEntity.ok(resourceService.getResourceById(id));
    }
    
    // Create resource (admin and staff)
    @PostMapping
    public ResponseEntity<Resource> createResource(@RequestBody Resource resource, Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(resourceService.createResource(resource, authentication));
    }

    // Get resources created by current user (staff and admin)
    @GetMapping("/my")
    public ResponseEntity<List<Resource>> getMyResources(Authentication authentication) {
        return ResponseEntity.ok(resourceService.getResourcesByCreator(authentication));
    }
    
    // Create multiple resources (admin only)
    @PostMapping("/bulk")
    public ResponseEntity<List<Resource>> createMultipleResources(@RequestBody List<Resource> resources) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(resourceService.createMultipleResources(resources));
    }
    
    // Update resource (admin and owner)
    @PutMapping("/{id}")
    public ResponseEntity<Resource> updateResource(@PathVariable String id, @RequestBody Resource resource, Authentication authentication) {
        return ResponseEntity.ok(resourceService.updateResource(id, resource, authentication));
    }

    // Update resource status (admin and owner)
    @PatchMapping("/{id}/status")
    public ResponseEntity<Resource> updateResourceStatus(@PathVariable String id, @RequestBody java.util.Map<String, String> statusUpdate, Authentication authentication) {
        return ResponseEntity.ok(resourceService.updateResourceStatus(id, statusUpdate.get("status"), authentication));
    }

    // Track resource share (public)
    @PostMapping("/{id}/share")
    public ResponseEntity<Resource> trackShare(@PathVariable String id) {
        return ResponseEntity.ok(resourceService.incrementShareCount(id));
    }

    // Delete resource (admin and owner)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(@PathVariable String id, Authentication authentication) {
        resourceService.deleteResource(id, authentication);
        return ResponseEntity.noContent().build();
    }
    
    // Search resources
    @GetMapping("/search")
    public ResponseEntity<List<Resource>> searchResources(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) String location) {
        return ResponseEntity.ok(resourceService.searchResources(status, type, minCapacity, location));
    }
    
    // Get resource availability
    @GetMapping("/{id}/availability")
    public ResponseEntity<Object> getResourceAvailability(
            @PathVariable String id,
            @RequestParam String date) {
        return ResponseEntity.ok(resourceService.getResourceAvailability(id, date));
    }

    // Assign staff to resource (admin only)
    @PostMapping("/{id}/assign-staff")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Resource> assignStaffToResource(
            @PathVariable String id,
            @RequestBody java.util.Map<String, List<String>> request) {
        List<String> staffIds = request.get("staffIds");
        return ResponseEntity.ok(resourceService.assignStaffToResource(id, staffIds));
    }

    // Get all staff users (LECTURER, NON_ACADEMIC, TECHNICIAN) for resource assignment (admin only)
    @GetMapping("/staff")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<StaffResponse>> getStaffUsers() {
        Query query = new Query();
        // Match users who have any of the staff roles (even if they have other roles too)
        query.addCriteria(Criteria.where("roles").in("LECTURER", "NON_ACADEMIC", "TECHNICIAN"));
        // Exclude only the problematic fields to avoid LocalDateTime serialization issues
        query.fields().exclude("createdAt", "lastLoginAt", "password", "googleId", "pictureUrl", "authProvider");

        List<User> staffUsers = mongoTemplate.find(query, User.class);
        List<StaffResponse> response = staffUsers.stream()
                .map(user -> new StaffResponse(
                        user.getId(),
                        user.getUsername(),
                        user.getName(),
                        user.getEmail(),
                        user.getRoles().stream().map(Role::toString).collect(Collectors.toSet()),
                        user.isEnabled()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    // Get resources by assigned staff ID
    @GetMapping("/staff/{staffId}/resources")
    public ResponseEntity<List<Resource>> getResourcesByStaffId(@PathVariable String staffId) {
        // Get resources where staff is assigned OR resources created by staff
        Query query = new Query();
        query.addCriteria(new Criteria().orOperator(
            Criteria.where("assignedStaff").in(staffId),
            Criteria.where("createdBy").is(staffId)
        ));
        List<Resource> resources = mongoTemplate.find(query, Resource.class);
        return ResponseEntity.ok(resources);
    }
}