package com.sliit.uniops.controller;

import com.sliit.uniops.dto.request.ResourceRequestDTO;
import com.sliit.uniops.model.Resource;
import com.sliit.uniops.service.ResourceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Resource Management", description = "APIs for managing campus facilities, equipment, and assets")
public class ResourceController {

    private final ResourceService resourceService;

    // Get all resources with filtering (public)
    @GetMapping
    @Operation(
        summary = "Get all resources",
        description = "Retrieve a list of all resources with optional filtering by type, status, location, capacity, search term, or creator"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved resources",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = Resource.class))))
    })
    public ResponseEntity<List<Resource>> getAllResources(
            @Parameter(description = "Filter by resource type (e.g., LECTURE_HALL, LAB, MEETING_ROOM, EQUIPMENT)")
            @RequestParam(required = false) String type,
            @Parameter(description = "Filter by resource status (e.g., ACTIVE, OUT_OF_SERVICE, UNDER_MAINTENANCE)")
            @RequestParam(required = false) String status,
            @Parameter(description = "Filter by location (partial match, case-insensitive)")
            @RequestParam(required = false) String location,
            @Parameter(description = "Filter by minimum capacity")
            @RequestParam(required = false) Integer minCapacity,
            @Parameter(description = "Search across name, location, and description (case-insensitive)")
            @RequestParam(required = false) String search,
            @Parameter(description = "Filter by creator user ID")
            @RequestParam(required = false) String creator) {
        return ResponseEntity.ok()
                .body(resourceService.getAllResources(type, status, location, minCapacity, search, creator));
    }
    
    // Get paginated resources
    @GetMapping("/paginated")
    @Operation(
        summary = "Get paginated resources",
        description = "Retrieve resources with pagination, sorting, and optional filtering"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved paginated resources")
    })
    public ResponseEntity<Object> getResourcesPaginated(
            @Parameter(description = "Page number (0-indexed)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Number of items per page")
            @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Search term for name, location, description")
            @RequestParam(required = false) String search,
            @Parameter(description = "Filter by status")
            @RequestParam(required = false) String status,
            @Parameter(description = "Filter by type")
            @RequestParam(required = false) String type,
            @Parameter(description = "Sort by field (e.g., name, capacity)")
            @RequestParam(required = false) String sortBy,
            @Parameter(description = "Sort direction (asc or desc)")
            @RequestParam(required = false) String sortDir) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(2, TimeUnit.MINUTES))
                .body(resourceService.getResourcesPaginated(page, size, search, status, type, sortBy, sortDir));
    }
    
    // Get resource by ID
    @GetMapping("/{id}")
    @Operation(summary = "Get resource by ID", description = "Retrieve a specific resource by its unique identifier")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved resource",
            content = @Content(schema = @Schema(implementation = Resource.class))),
        @ApiResponse(responseCode = "404", description = "Resource not found")
    })
    public ResponseEntity<Resource> getResourceById(
            @Parameter(description = "Resource ID")
            @PathVariable String id) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(10, TimeUnit.MINUTES))
                .body(resourceService.getResourceById(id));
    }

    // Create resource (admin and staff)
    @PostMapping
    @PreAuthorize("hasAnyRole('RESOURCE_MANAGER', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create a new resource", description = "Create a new resource (requires RESOURCE_MANAGER or ADMIN role)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Resource created successfully",
            content = @Content(schema = @Schema(implementation = Resource.class))),
        @ApiResponse(responseCode = "400", description = "Invalid input data"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions")
    })
    public ResponseEntity<Resource> createResource(
            @Parameter(description = "Resource data to create")
            @Valid @RequestBody ResourceRequestDTO resourceRequestDTO, Authentication authentication) {
        // Convert DTO to entity
        Resource resource = convertToEntity(resourceRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(resourceService.createResource(resource, authentication));
    }

    private Resource convertToEntity(ResourceRequestDTO dto) {
        return Resource.builder()
                .name(dto.getName())
                .type(dto.getType())
                .capacity(dto.getCapacity())
                .location(dto.getLocation())
                .description(dto.getDescription())
                .status(dto.getStatus())
                .availabilityWindows(dto.getAvailabilityWindows())
                .amenities(dto.getAmenities())
                .build();
    }

    // Get resources created by current user (staff and admin)
    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get my resources", description = "Retrieve resources created by the authenticated user")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved user's resources"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<List<Resource>> getMyResources(Authentication authentication) {
        return ResponseEntity.ok(resourceService.getResourcesByCreator(authentication));
    }

    // Create multiple resources (admin only)
    @PostMapping("/bulk")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Bulk create resources", description = "Create multiple resources at once (requires ADMIN role)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Resources created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input data"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions")
    })
    public ResponseEntity<List<Resource>> createMultipleResources(
            @Parameter(description = "List of resources to create")
            @Valid @RequestBody List<Resource> resources) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(resourceService.createMultipleResources(resources));
    }

    // Update resource (admin and owner)
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('RESOURCE_MANAGER', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update a resource", description = "Update an existing resource (RESOURCE_MANAGER or ADMIN)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Resource updated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input data"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Resource not found")
    })
    public ResponseEntity<Resource> updateResource(
            @Parameter(description = "Resource ID")
            @PathVariable String id,
            @Parameter(description = "Updated resource data")
            @Valid @RequestBody ResourceRequestDTO resourceRequestDTO, Authentication authentication) {
        Resource resource = convertToEntity(resourceRequestDTO);
        return ResponseEntity.ok(resourceService.updateResource(id, resource, authentication));
    }

    // Update resource status (admin and owner)
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('RESOURCE_MANAGER', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update resource status", description = "Update the status of a resource (RESOURCE_MANAGER or ADMIN)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Status updated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid status value"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Resource not found")
    })
    public ResponseEntity<Resource> updateResourceStatus(
            @Parameter(description = "Resource ID")
            @PathVariable String id,
            @Parameter(description = "Status update (e.g., {\"status\": \"ACTIVE\"})")
            @RequestBody java.util.Map<String, String> statusUpdate, Authentication authentication) {
        return ResponseEntity.ok(resourceService.updateResourceStatus(id, statusUpdate.get("status"), authentication));
    }

    // Track resource share (public)
    @PatchMapping("/{id}/share")
    @Operation(summary = "Track resource share", description = "Increment the share count for a resource")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Share count incremented successfully"),
        @ApiResponse(responseCode = "404", description = "Resource not found")
    })
    public ResponseEntity<Resource> trackShare(
            @Parameter(description = "Resource ID")
            @PathVariable String id) {
        return ResponseEntity.ok(resourceService.incrementShareCount(id));
    }

    // Delete resource (admin and owner)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete a resource", description = "Delete a resource (ADMIN or resource owner)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Resource deleted successfully"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Resource not found")
    })
    public ResponseEntity<Void> deleteResource(
            @Parameter(description = "Resource ID")
            @PathVariable String id, Authentication authentication) {
        resourceService.deleteResource(id, authentication);
        return ResponseEntity.noContent().build();
    }

    // Get resource availability
    @GetMapping("/{id}/availability")
    @Operation(summary = "Get resource availability", description = "Get availability windows for a resource on a specific date")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved availability"),
        @ApiResponse(responseCode = "404", description = "Resource not found")
    })
    public ResponseEntity<Object> getResourceAvailability(
            @Parameter(description = "Resource ID")
            @PathVariable String id,
            @Parameter(description = "Date in ISO format (e.g., 2026-04-19)")
            @RequestParam String date) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(1, TimeUnit.MINUTES))
                .body(resourceService.getResourceAvailability(id, date));
    }

    @GetMapping("/{id}/availability/check")
    @Operation(summary = "Check resource availability", description = "Check if a resource is available for a specific time slot")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Availability check completed"),
        @ApiResponse(responseCode = "404", description = "Resource not found")
    })
    public ResponseEntity<Map<String, Object>> checkResourceAvailability(
            @Parameter(description = "Resource ID")
            @PathVariable String id,
            @Parameter(description = "Date in ISO format (e.g., 2026-04-19)")
            @RequestParam String date,
            @Parameter(description = "Start time in HH:MM format (e.g., 09:00)")
            @RequestParam String startTime,
            @Parameter(description = "End time in HH:MM format (e.g., 10:00)")
            @RequestParam String endTime) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noCache())
                .body(resourceService.checkResourceAvailability(id, date, startTime, endTime));
    }

    @GetMapping("/{id}/audit")
    @Operation(summary = "Get resource audit log", description = "Retrieve audit information for a resource")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved audit log"),
        @ApiResponse(responseCode = "404", description = "Resource not found")
    })
    public ResponseEntity<List<Map<String, Object>>> getResourceAudit(
            @Parameter(description = "Resource ID")
            @PathVariable String id) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noCache())
                .body(resourceService.getResourceAudit(id));
    }
}
