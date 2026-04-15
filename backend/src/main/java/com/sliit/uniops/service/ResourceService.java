package com.sliit.uniops.service;

import com.sliit.uniops.model.Resource;
import com.sliit.uniops.repository.ResourceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class ResourceService {
    
    @Autowired
    private ResourceRepository resourceRepository;
    
    public List<Resource> getAllResources() {
        return resourceRepository.findAll();
    }
    
    public Resource getResourceById(String id) {
        return resourceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Resource not found with ID: " + id));
    }
    
    public Resource createResource(Resource resource) {
        return resourceRepository.save(resource);
    }
    
    public List<Resource> createMultipleResources(List<Resource> resources) {
        return resourceRepository.saveAll(resources);
    }
    
    public Resource updateResource(String id, Resource resourceDetails) {
        Resource resource = getResourceById(id);
        resource.setName(resourceDetails.getName());
        resource.setType(resourceDetails.getType());
        resource.setCapacity(resourceDetails.getCapacity());
        resource.setLocation(resourceDetails.getLocation());
        resource.setStatus(resourceDetails.getStatus());
        return resourceRepository.save(resource);
    }
    
    public void deleteResource(String id) {
        resourceRepository.deleteById(id);
    }
    
    public List<Resource> searchResources(String status, String type, Integer minCapacity, String location) {
        List<Resource> resources = resourceRepository.findAll();
        
        if (status != null && !status.isEmpty()) {
            resources = resources.stream()
                .filter(r -> r.getStatus().toString().equalsIgnoreCase(status))
                .toList();
        }
        
        if (type != null && !type.isEmpty()) {
            resources = resources.stream()
                .filter(r -> r.getType().toString().equalsIgnoreCase(type))
                .toList();
        }
        
        if (minCapacity != null) {
            resources = resources.stream()
                .filter(r -> r.getCapacity() >= minCapacity)
                .toList();
        }
        
        if (location != null && !location.isEmpty()) {
            resources = resources.stream()
                .filter(r -> r.getLocation() != null && r.getLocation().toLowerCase().contains(location.toLowerCase()))
                .toList();
        }
        
        return resources;
    }
    
    public Object getResourceAvailability(String resourceId, String date) {
        // For now, return a simple availability structure
        // This can be enhanced to check actual bookings
        Resource resource = getResourceById(resourceId);
        
        // Create a simple map for the response
        java.util.Map<String, Object> availability = new java.util.HashMap<>();
        availability.put("resourceId", resource.getId());
        availability.put("resourceName", resource.getName());
        availability.put("date", date);
        availability.put("availableSlots", List.of(
            "09:00-10:00", "10:00-11:00", "11:00-12:00",
            "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00"
        ));
        availability.put("bookedSlots", List.of()); // Would be populated from actual bookings
        
        return availability;
    }
    
    public Object getResourcesPaginated(int page, int size, String search, String status, String type) {
        List<Resource> resources = resourceRepository.findAll();
        
        // Apply filters
        if (search != null && !search.trim().isEmpty()) {
            String searchTerm = search.toLowerCase();
            resources = resources.stream()
                .filter(r -> r.getName().toLowerCase().contains(searchTerm) ||
                           r.getLocation().toLowerCase().contains(searchTerm) ||
                           r.getDescription().toLowerCase().contains(searchTerm))
                .toList();
        }
        
        if (status != null && !status.isEmpty()) {
            resources = resources.stream()
                .filter(r -> r.getStatus().toString().equals(status))
                .toList();
        }
        
        if (type != null && !type.isEmpty()) {
            resources = resources.stream()
                .filter(r -> r.getType().toString().equals(type))
                .toList();
        }
        
        // Apply pagination
        int totalElements = resources.size();
        int startIndex = page * size;
        int endIndex = Math.min(startIndex + size, totalElements);
        
        List<Resource> paginatedResources = new ArrayList<>();
        if (startIndex < totalElements) {
            paginatedResources = resources.subList(startIndex, endIndex);
        }
        
        // Create response
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("content", paginatedResources);
        response.put("totalElements", totalElements);
        response.put("totalPages", (int) Math.ceil((double) totalElements / size));
        response.put("size", size);
        response.put("number", page);
        response.put("first", page == 0);
        response.put("last", endIndex >= totalElements);
        
        return response;
    }
}