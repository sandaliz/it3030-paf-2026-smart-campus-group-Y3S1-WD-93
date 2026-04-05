package com.sliit.uniops.service;

import com.sliit.uniops.model.Resource;
import com.sliit.uniops.repository.ResourceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
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
}