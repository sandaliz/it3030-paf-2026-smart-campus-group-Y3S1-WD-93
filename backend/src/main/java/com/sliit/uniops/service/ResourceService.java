package com.sliit.uniops.service;

import com.sliit.uniops.model.Resource;
import com.sliit.uniops.repository.ResourceRepository;
import com.sliit.uniops.exception.ResourceNotFoundException;
import com.sliit.uniops.exception.DuplicateResourceException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResourceService {
    
    private final ResourceRepository resourceRepository;
    
    // Create
    @Transactional
    public Resource createResource(Resource resource) {
        // Check if resource with same name already exists
        if (resourceRepository.existsByNameIgnoreCase(resource.getName())) {
            throw new DuplicateResourceException("Resource with name '" + resource.getName() + "' already exists");
        }
        
        // Set timestamps
        resource.setTimestamps();
        
        // Set default status if not provided
        if (resource.getStatus() == null) {
            resource.setStatus(Resource.ResourceStatus.ACTIVE);
        }
        
        return resourceRepository.save(resource);
    }
    
    // Read all
    public List<Resource> getAllResources() {
        return resourceRepository.findAll();
    }
    
    // Read by ID
    public Resource getResourceById(String id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + id));
    }
    
    // Update
    @Transactional
    public Resource updateResource(String id, Resource resourceDetails) {
        Resource existingResource = getResourceById(id);
        
        // Check name uniqueness if name is being changed
        if (!existingResource.getName().equalsIgnoreCase(resourceDetails.getName()) &&
            resourceRepository.existsByNameIgnoreCase(resourceDetails.getName())) {
            throw new DuplicateResourceException("Resource with name '" + resourceDetails.getName() + "' already exists");
        }
        
        // Update fields
        existingResource.setName(resourceDetails.getName());
        existingResource.setType(resourceDetails.getType());
        existingResource.setCapacity(resourceDetails.getCapacity());
        existingResource.setLocation(resourceDetails.getLocation());
        existingResource.setAvailabilityWindows(resourceDetails.getAvailabilityWindows());
        existingResource.setStatus(resourceDetails.getStatus());
        existingResource.setDescription(resourceDetails.getDescription());
        existingResource.setAmenities(resourceDetails.getAmenities());
        existingResource.setUpdatedAt(java.time.LocalDateTime.now());
        
        return resourceRepository.save(existingResource);
    }
    
    // Delete
    @Transactional
    public void deleteResource(String id) {
        if (!resourceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Resource not found with id: " + id);
        }
        resourceRepository.deleteById(id);
    }
    
    // Find by type
    public List<Resource> getResourcesByType(Resource.ResourceType type) {
        return resourceRepository.findByType(type);
    }
    
    // Find by status
    public List<Resource> getResourcesByStatus(Resource.ResourceStatus status) {
        return resourceRepository.findByStatus(status);
    }
    
    // Find by location
    public List<Resource> getResourcesByLocation(String location) {
        return resourceRepository.findByLocationContainingIgnoreCase(location);
    }
    
    // Find by minimum capacity
    public List<Resource> getResourcesByMinCapacity(int minCapacity) {
        return resourceRepository.findByCapacityGreaterThanEqual(minCapacity);
    }
    
    // Search with multiple filters
public List<Resource> searchResources(Resource.ResourceType type, Integer minCapacity, Resource.ResourceStatus status) {
    if (type != null && minCapacity != null && status != null) {
        return resourceRepository.findByFilters(type, minCapacity, status);
    } else if (type != null && minCapacity != null) {
        // Use a combination of type and capacity
        return resourceRepository.findByType(type).stream()
                .filter(r -> r.getCapacity() >= minCapacity)
                .collect(Collectors.toList());
    } else if (type != null) {
        return resourceRepository.findByType(type);
    } else if (minCapacity != null) {
        return resourceRepository.findByCapacityGreaterThanEqual(minCapacity);
    } else if (status != null) {
        return resourceRepository.findByStatus(status);
    } else {
        return resourceRepository.findAll();
    }
}
}