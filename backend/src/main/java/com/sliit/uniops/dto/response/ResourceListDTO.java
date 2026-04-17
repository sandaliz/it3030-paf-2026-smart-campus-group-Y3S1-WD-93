package com.sliit.uniops.dto.response;

import com.sliit.uniops.model.Resource;
import lombok.Data;

@Data
public class ResourceListDTO {
    private String id;
    private String name;
    private Resource.ResourceType type;
    private Integer capacity;
    private String location;
    private Resource.ResourceStatus status;
    private String description;
    
    public static ResourceListDTO fromEntity(Resource resource) {
        ResourceListDTO dto = new ResourceListDTO();
        dto.setId(resource.getId());
        dto.setName(resource.getName());
        dto.setType(resource.getType());
        dto.setCapacity(resource.getCapacity());
        dto.setLocation(resource.getLocation());
        dto.setStatus(resource.getStatus());
        dto.setDescription(resource.getDescription());
        return dto;
    }
}
