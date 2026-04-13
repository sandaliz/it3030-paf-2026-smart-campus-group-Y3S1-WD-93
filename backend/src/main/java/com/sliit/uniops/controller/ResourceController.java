package com.sliit.uniops.controller;

import com.sliit.uniops.dto.request.ResourceRequestDTO;
import com.sliit.uniops.dto.response.ResourceResponseDTO;
import com.sliit.uniops.model.Resource;
import com.sliit.uniops.service.ResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:3000"})
public class ResourceController {
    
    private final ResourceService resourceService;
    
    // GET all resources
    @GetMapping
    public ResponseEntity<List<ResourceResponseDTO>> getAllResources() {
        List<Resource> resources = resourceService.getAllResources();
        List<ResourceResponseDTO> dtos = resources.stream()
                .map(ResourceResponseDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    // GET all resources with pagination
    @GetMapping("/paginated")
    public ResponseEntity<Page<ResourceResponseDTO>> getAllResourcesPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        
        Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        Page<Resource> resourcePage = resourceService.getAllResources(pageable);
        Page<ResourceResponseDTO> dtoPage = resourcePage.map(ResourceResponseDTO::fromEntity);
        
        return ResponseEntity.ok(dtoPage);
    }
    
    // GET resource by ID
    @GetMapping("/{id}")
    public ResponseEntity<ResourceResponseDTO> getResourceById(@PathVariable String id) {
        Resource resource = resourceService.getResourceById(id);
        return ResponseEntity.ok(ResourceResponseDTO.fromEntity(resource));
    }
    
    // GET resources by type
    @GetMapping("/type/{type}")
    public ResponseEntity<List<ResourceResponseDTO>> getResourcesByType(@PathVariable Resource.ResourceType type) {
        List<Resource> resources = resourceService.getResourcesByType(type);
        List<ResourceResponseDTO> dtos = resources.stream()
                .map(ResourceResponseDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    // GET resources by status
    @GetMapping("/status/{status}")
    public ResponseEntity<List<ResourceResponseDTO>> getResourcesByStatus(@PathVariable Resource.ResourceStatus status) {
        List<Resource> resources = resourceService.getResourcesByStatus(status);
        List<ResourceResponseDTO> dtos = resources.stream()
                .map(ResourceResponseDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    // GET resources by location
    @GetMapping("/location")
    public ResponseEntity<List<ResourceResponseDTO>> getResourcesByLocation(@RequestParam String location) {
        List<Resource> resources = resourceService.getResourcesByLocation(location);
        List<ResourceResponseDTO> dtos = resources.stream()
                .map(ResourceResponseDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    // GET resources by minimum capacity
    @GetMapping("/capacity")
    public ResponseEntity<List<ResourceResponseDTO>> getResourcesByMinCapacity(@RequestParam int minCapacity) {
        List<Resource> resources = resourceService.getResourcesByMinCapacity(minCapacity);
        List<ResourceResponseDTO> dtos = resources.stream()
                .map(ResourceResponseDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    // GET search with multiple filters
    @GetMapping("/search")
    public ResponseEntity<List<ResourceResponseDTO>> searchResources(
            @RequestParam(required = false) Resource.ResourceType type,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) Resource.ResourceStatus status) {
        List<Resource> resources = resourceService.searchResources(type, minCapacity, status);
        List<ResourceResponseDTO> dtos = resources.stream()
                .map(ResourceResponseDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    // POST create new resource (JSON only)
    @PostMapping(consumes = "application/json")
    public ResponseEntity<ResourceResponseDTO> createResource(@Valid @RequestBody ResourceRequestDTO resourceRequestDTO) {
        Resource resource = convertToEntity(resourceRequestDTO);
        Resource createdResource = resourceService.createResource(resource);
        return new ResponseEntity<>(ResourceResponseDTO.fromEntity(createdResource), HttpStatus.CREATED);
    }
    
    // PUT update resource (JSON only)
    @PutMapping(value = "/{id}", consumes = "application/json")
    public ResponseEntity<ResourceResponseDTO> updateResource(
            @PathVariable String id, 
            @Valid @RequestBody ResourceRequestDTO resourceRequestDTO) {
        Resource resourceDetails = convertToEntity(resourceRequestDTO);
        Resource updatedResource = resourceService.updateResource(id, resourceDetails);
        return ResponseEntity.ok(ResourceResponseDTO.fromEntity(updatedResource));
    }
    
    // DELETE resource
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(@PathVariable String id) {
        resourceService.deleteResource(id);
        return ResponseEntity.noContent().build();
    }
    
    // GET resource availability for a specific date
    @GetMapping("/{id}/availability")
    public ResponseEntity<Map<String, Object>> getResourceAvailability(
            @PathVariable String id,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate date) {
        
        List<Resource.AvailabilityWindow> availability = resourceService.getResourceAvailability(id, date);
        
        Map<String, Object> response = new HashMap<>();
        response.put("resourceId", id);
        response.put("date", date);
        response.put("availability", availability);
        response.put("isAvailable", !availability.isEmpty());
        
        return ResponseEntity.ok(response);
    }
    
    // PATCH update resource status (Admin only)
    @PatchMapping("/{id}/status")
    public ResponseEntity<ResourceResponseDTO> updateResourceStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> statusUpdate) {
        
        String newStatus = statusUpdate.get("status");
        if (newStatus == null || newStatus.trim().isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("timestamp", java.time.LocalDateTime.now());
            error.put("status", 400);
            error.put("error", "Bad Request");
            error.put("message", "Status field is required");
            error.put("path", "/api/resources/" + id + "/status");
            return ResponseEntity.badRequest().body(null);
        }
        
        // Get existing resource
        Resource existingResource = resourceService.getResourceById(id);
        
        // Update only the status
        existingResource.setStatus(Resource.ResourceStatus.valueOf(newStatus.toUpperCase()));
        existingResource.setUpdatedAt(java.time.LocalDateTime.now());
        
        Resource updatedResource = resourceService.updateResource(id, existingResource);
        return ResponseEntity.ok(ResourceResponseDTO.fromEntity(updatedResource));
    }
    
        
    // POST bulk create resources (Admin only)
    @PostMapping("/bulk")
    public ResponseEntity<List<ResourceResponseDTO>> bulkCreateResources(
            @Valid @RequestBody List<ResourceRequestDTO> resourceRequests) {
        
        List<ResourceResponseDTO> createdResources = resourceRequests.stream()
                .map(dto -> {
                    Resource resource = convertToEntity(dto);
                    Resource created = resourceService.createResource(resource);
                    return ResourceResponseDTO.fromEntity(created);
                })
                .collect(Collectors.toList());
        
        return new ResponseEntity<>(createdResources, HttpStatus.CREATED);
    }
    
    // GET resource audit log (Admin only)
    @GetMapping("/{id}/audit")
    public ResponseEntity<Map<String, Object>> getResourceAudit(@PathVariable String id) {
        Resource resource = resourceService.getResourceById(id);
        
        Map<String, Object> audit = new HashMap<>();
        audit.put("resourceId", id);
        audit.put("name", resource.getName());
        audit.put("createdAt", resource.getCreatedAt());
        audit.put("updatedAt", resource.getUpdatedAt());
        audit.put("lastModified", resource.getUpdatedAt());
        audit.put("status", resource.getStatus());
        audit.put("type", resource.getType());
        
        return ResponseEntity.ok(audit);
    }
    
    // GET check if resource is available at specific time
    @GetMapping("/{id}/availability/check")
    public ResponseEntity<Map<String, Object>> checkResourceAvailability(
            @PathVariable String id,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate date,
            @RequestParam @DateTimeFormat(pattern = "HH:mm") LocalTime startTime,
            @RequestParam @DateTimeFormat(pattern = "HH:mm") LocalTime endTime) {
        
        boolean isAvailable = resourceService.isResourceAvailable(id, date, startTime, endTime);
        
        Map<String, Object> response = new HashMap<>();
        response.put("resourceId", id);
        response.put("date", date);
        response.put("startTime", startTime);
        response.put("endTime", endTime);
        response.put("isAvailable", isAvailable);
        
        return ResponseEntity.ok(response);
    }
    
    // Helper method to convert DTO to Entity
    private Resource convertToEntity(ResourceRequestDTO dto) {
        Resource resource = new Resource();
        resource.setName(dto.getName());
        resource.setType(dto.getType());
        resource.setCapacity(dto.getCapacity());
        resource.setLocation(dto.getLocation());
        resource.setAvailabilityWindows(dto.getAvailabilityWindows());
        resource.setStatus(dto.getStatus());
        resource.setDescription(dto.getDescription());
        resource.setAmenities(dto.getAmenities());
        return resource;
    }
    
    // Health check endpoint
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Resource Controller is working!");
    }
}