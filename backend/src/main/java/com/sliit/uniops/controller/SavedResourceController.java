package com.sliit.uniops.controller;

import com.sliit.uniops.model.Resource;
import com.sliit.uniops.model.SavedResource;
import com.sliit.uniops.security.UserPrincipal;
import com.sliit.uniops.service.ResourceService;
import com.sliit.uniops.service.SavedResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/saved-resources")
@RequiredArgsConstructor
public class SavedResourceController {
    private final SavedResourceService savedResourceService;
    private final ResourceService resourceService;

    private String getUserId(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserPrincipal user) {
            return user.getId();
        }
        return authentication.getName();
    }

    @PostMapping("/{resourceId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> saveResource(
            @PathVariable String resourceId,
            Authentication authentication) {
        try {
            String userId = getUserId(authentication);
            SavedResource savedResource = savedResourceService.saveResource(userId, resourceId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Resource saved successfully");
            response.put("savedResource", savedResource);
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to save resource: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @DeleteMapping("/{resourceId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> unsaveResource(
            @PathVariable String resourceId,
            Authentication authentication) {
        try {
            String userId = getUserId(authentication);
            savedResourceService.unsaveResource(userId, resourceId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Resource unsaved successfully");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to unsave resource: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Map<String, Object>>> getUserSavedResources(Authentication authentication) {
        try {
            String userId = getUserId(authentication);
            List<SavedResource> savedResources = savedResourceService.getUserSavedResources(userId);
            
            List<Map<String, Object>> result = savedResources.stream()
                    .map(saved -> {
                        try {
                            Map<String, Object> data = new HashMap<>();
                            data.put("id", saved.getId());
                            data.put("resourceId", saved.getResourceId());
                            data.put("savedAt", saved.getSavedAt());
                            data.put("note", saved.getNote());
                            
                            // Fetch resource details
                            Resource resource = resourceService.getResourceById(saved.getResourceId());
                            if (resource != null) {
                                data.put("name", resource.getName());
                                data.put("type", resource.getType());
                                data.put("location", resource.getLocation());
                                data.put("status", resource.getStatus());
                            }
                            
                            return data;
                        } catch (Exception e) {
                            return null;
                        }
                    })
                    .filter(data -> data != null)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/check/{resourceId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> checkIfResourceSaved(
            @PathVariable String resourceId,
            Authentication authentication) {
        try {
            String userId = getUserId(authentication);
            boolean isSaved = savedResourceService.isResourceSaved(userId, resourceId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("isSaved", isSaved);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("isSaved", false);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PutMapping("/{resourceId}/note")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> updateResourceNote(
            @PathVariable String resourceId,
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        try {
            String userId = getUserId(authentication);
            String note = request.get("note");
            savedResourceService.updateResourceNote(userId, resourceId, note);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Note updated successfully");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to update note: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
