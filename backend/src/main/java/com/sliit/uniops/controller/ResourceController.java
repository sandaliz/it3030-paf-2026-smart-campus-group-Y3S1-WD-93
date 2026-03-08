package com.sliit.uniops.controller;

import com.sliit.uniops.dto.request.ResourceRequestDTO;
import com.sliit.uniops.dto.response.ResourceResponseDTO;
import com.sliit.uniops.model.Resource;
import com.sliit.uniops.service.ResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
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
    
    // POST create new resource
    @PostMapping
    public ResponseEntity<ResourceResponseDTO> createResource(@Valid @RequestBody ResourceRequestDTO resourceRequestDTO) {
        Resource resource = convertToEntity(resourceRequestDTO);
        Resource createdResource = resourceService.createResource(resource);
        return new ResponseEntity<>(ResourceResponseDTO.fromEntity(createdResource), HttpStatus.CREATED);
    }
    
    // PUT update resource
    @PutMapping("/{id}")
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