package com.sliit.uniops.service;

import com.sliit.uniops.model.Resource;
import com.sliit.uniops.model.SavedResource;
import com.sliit.uniops.repository.SavedResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SavedResourceService {
    private final SavedResourceRepository savedResourceRepository;
    private final ResourceService resourceService;

    public SavedResource saveResource(String userId, String resourceId) {
        // Check if resource exists
        Resource resource = resourceService.getResourceById(resourceId);
        if (resource == null) {
            throw new IllegalArgumentException("Resource not found");
        }

        // Check if already saved
        Optional<SavedResource> existing = savedResourceRepository.findByUserIdAndResourceId(userId, resourceId);
        if (existing.isPresent()) {
            return existing.get(); // Already saved
        }

        SavedResource savedResource = new SavedResource(userId, resourceId);
        return savedResourceRepository.save(savedResource);
    }

    public void unsaveResource(String userId, String resourceId) {
        savedResourceRepository.deleteByUserIdAndResourceId(userId, resourceId);
    }

    public List<SavedResource> getUserSavedResources(String userId) {
        return savedResourceRepository.findByUserId(userId);
    }

    public boolean isResourceSaved(String userId, String resourceId) {
        return savedResourceRepository.findByUserIdAndResourceId(userId, resourceId).isPresent();
    }

    public void updateResourceNote(String userId, String resourceId, String note) {
        Optional<SavedResource> savedResource = savedResourceRepository.findByUserIdAndResourceId(userId, resourceId);
        if (savedResource.isPresent()) {
            SavedResource resource = savedResource.get();
            resource.setNote(note);
            savedResourceRepository.save(resource);
        }
    }
}
