package com.sliit.uniops.dto.request;

import com.sliit.uniops.model.Resource;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.List;

@Data
public class ResourceRequestDTO {
    
    @NotBlank(message = "Resource name is required")
    private String name;
    
    @NotNull(message = "Resource type is required")
    private Resource.ResourceType type;
    
    @Min(value = 1, message = "Capacity must be at least 1")
    private int capacity;
    
    @NotBlank(message = "Location is required")
    private String location;
    
    @Valid
    private List<Resource.AvailabilityWindow> availabilityWindows;
    
    @NotNull(message = "Status is required")
    private Resource.ResourceStatus status;
    
    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;
    
    private List<String> amenities;
}
