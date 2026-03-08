package com.sliit.uniops.repository;

import com.sliit.uniops.model.Resource;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ResourceRepository extends MongoRepository<Resource, String> {
    
    // Find by type
    List<Resource> findByType(Resource.ResourceType type);
    
    // Find by status
    List<Resource> findByStatus(Resource.ResourceStatus status);
    
    // Find by location containing (case insensitive)
    List<Resource> findByLocationContainingIgnoreCase(String location);
    
    // Find by capacity greater than or equal
    List<Resource> findByCapacityGreaterThanEqual(int minCapacity);
    
    // Find by name (case insensitive)
    Optional<Resource> findByNameIgnoreCase(String name);
    
    // Custom query with multiple filters
    @Query("{ 'type': ?0, 'capacity': { $gte: ?1 }, 'status': ?2 }")
    List<Resource> findByFilters(Resource.ResourceType type, int minCapacity, Resource.ResourceStatus status);
    
    // Count by status
    long countByStatus(Resource.ResourceStatus status);
    
    // Check if exists by name
    boolean existsByNameIgnoreCase(String name);
    
    // Find by type AND status (this was missing!)
    List<Resource> findByTypeAndStatus(Resource.ResourceType type, Resource.ResourceStatus status);
}