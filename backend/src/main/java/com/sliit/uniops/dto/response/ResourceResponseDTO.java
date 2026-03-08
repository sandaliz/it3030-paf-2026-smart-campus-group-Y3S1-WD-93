package com.sliit.uniops.dto.response;

import com.sliit.uniops.model.Resource;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ResourceResponseDTO {
    private String id;
    private String name;
    private Resource.ResourceType type;
    private int capacity;
    private String location;
    private List<Resource.AvailabilityWindow> availabilityWindows;
    private Resource.ResourceStatus status;
    private String description;
    private List<String> amenities;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Static method to convert Entity to DTO
    public static ResourceResponseDTO fromEntity(Resource resource) {
        ResourceResponseDTO dto = new ResourceResponseDTO();
        dto.setId(resource.getId());
        dto.setName(resource.getName());
        dto.setType(resource.getType());
        dto.setCapacity(resource.getCapacity());
        dto.setLocation(resource.getLocation());
        dto.setAvailabilityWindows(resource.getAvailabilityWindows());
        dto.setStatus(resource.getStatus());
        dto.setDescription(resource.getDescription());
        dto.setAmenities(resource.getAmenities());
        dto.setCreatedAt(resource.getCreatedAt());
        dto.setUpdatedAt(resource.getUpdatedAt());
        return dto;
    }
}