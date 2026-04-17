package com.sliit.uniops.controller;

import com.sliit.uniops.model.Resource;
import com.sliit.uniops.service.ResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:3000"})
public class ResourceController {
    
    private final ResourceService resourceService;
    
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
    
    // Create resource (admin only)
    @PostMapping
    public ResponseEntity<Resource> createResource(@RequestBody Resource resource) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(resourceService.createResource(resource));
    }
    
    // Create multiple resources (admin only)
    @PostMapping("/bulk")
    public ResponseEntity<List<Resource>> createMultipleResources(@RequestBody List<Resource> resources) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(resourceService.createMultipleResources(resources));
    }
    
    // Update resource (admin only)
    @PutMapping("/{id}")
    public ResponseEntity<Resource> updateResource(@PathVariable String id, @RequestBody Resource resource) {
        return ResponseEntity.ok(resourceService.updateResource(id, resource));
    }

    // Update resource status (admin only)
    @PatchMapping("/{id}/status")
    public ResponseEntity<Resource> updateResourceStatus(@PathVariable String id, @RequestBody java.util.Map<String, String> statusUpdate) {
        return ResponseEntity.ok(resourceService.updateResourceStatus(id, statusUpdate.get("status")));
    }
    
    // Delete resource (admin only)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(@PathVariable String id) {
        resourceService.deleteResource(id);
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
}