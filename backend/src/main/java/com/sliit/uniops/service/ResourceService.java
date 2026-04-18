package com.sliit.uniops.service;

import com.sliit.uniops.model.Resource;
import com.sliit.uniops.repository.ResourceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class ResourceService {

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private MongoTemplate mongoTemplate;
    
    public List<Resource> getAllResources() {
        Query query = new Query();
        query.fields().include("id", "name", "type", "capacity", "location", "status", "description");
        return mongoTemplate.find(query, Resource.class);
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

    public Resource updateResourceStatus(String id, String status) {
        Resource resource = getResourceById(id);
        resource.setStatus(Resource.ResourceStatus.valueOf(status));
        return resourceRepository.save(resource);
    }

    public Resource incrementShareCount(String id) {
        Resource resource = getResourceById(id);
        if (resource.getShareCount() == null) {
            resource.setShareCount(1);
        } else {
            resource.setShareCount(resource.getShareCount() + 1);
        }
        return resourceRepository.save(resource);
    }
    
    public void deleteResource(String id) {
        resourceRepository.deleteById(id);
    }
    
    public List<Resource> searchResources(String status, String type, Integer minCapacity, String location) {
        Query query = new Query();

        if (status != null && !status.isEmpty()) {
            query.addCriteria(Criteria.where("status").is(status));
        }
        if (type != null && !type.isEmpty()) {
            query.addCriteria(Criteria.where("type").is(type));
        }
        if (minCapacity != null) {
            query.addCriteria(Criteria.where("capacity").gte(minCapacity));
        }
        if (location != null && !location.isEmpty()) {
            query.addCriteria(Criteria.where("location").regex(location, "i"));
        }

        query.fields().include("id", "name", "type", "capacity", "location", "status", "description");
        return mongoTemplate.find(query, Resource.class);
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
    
    public Object getResourcesPaginated(int page, int size, String search, String status, String type, String sortBy, String sortDir) {
        Query query = new Query();

        // Build dynamic query
        if (search != null && !search.trim().isEmpty()) {
            Criteria searchCriteria = new Criteria().orOperator(
                Criteria.where("name").regex(search, "i"),
                Criteria.where("location").regex(search, "i"),
                Criteria.where("description").regex(search, "i")
            );
            query.addCriteria(searchCriteria);
        } else {
            if (status != null && !status.isEmpty()) {
                query.addCriteria(Criteria.where("status").is(status));
            }
            if (type != null && !type.isEmpty()) {
                query.addCriteria(Criteria.where("type").is(type));
            }
        }

        // Field projection
        query.fields().include("id", "name", "type", "capacity", "location", "status", "description");

        // Sorting
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir != null ? sortDir : "asc"), sortBy != null ? sortBy : "name");
        query.with(sort);

        // Count total elements
        long totalElements = mongoTemplate.count(query, Resource.class);

        // Pagination
        query.skip((long) page * size).limit(size);

        List<Resource> content = mongoTemplate.find(query, Resource.class);

        // Create response
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("content", content);
        response.put("totalElements", totalElements);
        response.put("totalPages", (int) Math.ceil((double) totalElements / size));
        response.put("size", size);
        response.put("number", page);
        response.put("first", page == 0);
        response.put("last", (page + 1) * size >= totalElements);

        return response;
    }
}