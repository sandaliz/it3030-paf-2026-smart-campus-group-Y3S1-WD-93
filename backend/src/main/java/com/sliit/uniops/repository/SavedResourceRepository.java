package com.sliit.uniops.repository;

import com.sliit.uniops.model.SavedResource;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SavedResourceRepository extends MongoRepository<SavedResource, String> {
    Optional<SavedResource> findByUserIdAndResourceId(String userId, String resourceId);
    List<SavedResource> findByUserId(String userId);
    void deleteByUserIdAndResourceId(String userId, String resourceId);
}
