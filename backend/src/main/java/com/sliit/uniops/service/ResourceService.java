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
        resource.setDescription(resourceDetails.getDescription());
        resource.setAmenities(resourceDetails.getAmenities());
        resource.setAvailabilityWindows(resourceDetails.getAvailabilityWindows());
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
        Resource resource = getResourceById(resourceId);
        
        // Get the day of week from the date
        java.time.LocalDate localDate = java.time.LocalDate.parse(date);
        java.time.DayOfWeek dayOfWeek = localDate.getDayOfWeek();
        String dayName = dayOfWeek.toString(); // MONDAY, TUESDAY, etc.
        
        // Check if resource has availability windows for this day
        boolean isAvailable = false;
        java.util.List<java.util.Map<String, String>> availableTimeSlots = new java.util.ArrayList<>();
        
        if (resource.getAvailabilityWindows() != null) {
            for (Resource.AvailabilityWindow window : resource.getAvailabilityWindows()) {
                if (window.getDayOfWeek() != null && window.getDayOfWeek().equals(dayName) && window.isAvailable()) {
                    isAvailable = true;
                    java.util.Map<String, String> slot = new java.util.HashMap<>();
                    slot.put("dayOfWeek", window.getDayOfWeek());
                    slot.put("startTime", window.getStartTime());
                    slot.put("endTime", window.getEndTime());
                    availableTimeSlots.add(slot);
                }
            }
        }
        
        // Create a simple map for the response
        java.util.Map<String, Object> availability = new java.util.HashMap<>();
        availability.put("resourceId", resource.getId());
        availability.put("resourceName", resource.getName());
        availability.put("date", date);
        availability.put("isAvailable", isAvailable);
        availability.put("availability", availableTimeSlots);
        availability.put("dayOfWeek", dayName);
        
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