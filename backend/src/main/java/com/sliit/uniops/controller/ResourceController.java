package com.sliit.uniops.controller;

import com.sliit.uniops.model.Resource;
import com.sliit.uniops.service.ResourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:3000"})
public class ResourceController {

    private final ResourceService resourceService;
    
    // Get all resources with filtering (public)
    @GetMapping
    public ResponseEntity<List<Resource>> getAllResources(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String creator) {
        return ResponseEntity.ok()
                .body(resourceService.getAllResources(type, status, location, minCapacity, search, creator));
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
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(2, TimeUnit.MINUTES))
                .body(resourceService.getResourcesPaginated(page, size, search, status, type, sortBy, sortDir));
    }
    
    // Get resource by ID
    @GetMapping("/{id}")
    public ResponseEntity<Resource> getResourceById(@PathVariable String id) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(10, TimeUnit.MINUTES))
                .body(resourceService.getResourceById(id));
    }
    
    // Create resource (admin and staff)
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<Resource> createResource(@Valid @RequestBody Resource resource, Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(resourceService.createResource(resource, authentication));
    }

    // Get resources created by current user (staff and admin)
    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Resource>> getMyResources(Authentication authentication) {
        return ResponseEntity.ok(resourceService.getResourcesByCreator(authentication));
    }

    
    // Create multiple resources (admin only)
    @PostMapping("/bulk")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Resource>> createMultipleResources(@Valid @RequestBody List<Resource> resources) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(resourceService.createMultipleResources(resources));
    }
    
    // Update resource (admin and owner)
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<Resource> updateResource(@PathVariable String id, @Valid @RequestBody Resource resource, Authentication authentication) {
        return ResponseEntity.ok(resourceService.updateResource(id, resource, authentication));
    }

    // Update resource status (admin and owner)
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<Resource> updateResourceStatus(@PathVariable String id, @RequestBody java.util.Map<String, String> statusUpdate, Authentication authentication) {
        return ResponseEntity.ok(resourceService.updateResourceStatus(id, statusUpdate.get("status"), authentication));
    }

    // Track resource share (public)
    @PatchMapping("/{id}/share")
    public ResponseEntity<Resource> trackShare(@PathVariable String id) {
        return ResponseEntity.ok(resourceService.incrementShareCount(id));
    }

    // Delete resource (admin and owner)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<Void> deleteResource(@PathVariable String id, Authentication authentication) {
        resourceService.deleteResource(id, authentication);
        return ResponseEntity.noContent().build();
    }
    
    
    // Get resource availability
    @GetMapping("/{id}/availability")
    public ResponseEntity<Object> getResourceAvailability(
            @PathVariable String id,
            @RequestParam String date) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(1, TimeUnit.MINUTES))
                .body(resourceService.getResourceAvailability(id, date));
    }

    @GetMapping("/{id}/availability/check")
    public ResponseEntity<Map<String, Object>> checkResourceAvailability(
            @PathVariable String id,
            @RequestParam String date,
            @RequestParam String startTime,
            @RequestParam String endTime) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noCache())
                .body(resourceService.checkResourceAvailability(id, date, startTime, endTime));
    }

    @GetMapping("/{id}/audit")
    public ResponseEntity<List<Map<String, Object>>> getResourceAudit(@PathVariable String id) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noCache())
                .body(resourceService.getResourceAudit(id));
    }
}
