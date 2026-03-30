package com.sliit.uniops.repository.ticket;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.sliit.uniops.model.ticket.TicketModel;
import org.springframework.data.domain.Pageable;


@Repository
public interface TicketRepository extends MongoRepository<TicketModel, String> {
    // Find by creator
    List<TicketModel> findByCreatedBy(String userId);
    Page<TicketModel> findByCreatedBy(String userId, Pageable pageable);

    // Find by assigned technician
    List<TicketModel> findByAssignedTo(String technicianId);
    Page<TicketModel> findByAssignedTo(String technicianId, Pageable pageable);

    // Find by status
    List<TicketModel> findByStatus(String status);

    // Find active tickets for technician
    @Query("{'assignedTo': ?0, 'status': {$in: [?1, ?2]}}")
    List<TicketModel> findActiveTicketsByTechnician(String technicianId, String status1, String status2);

    // Count by status
    long countByStatus(String status);

    // Find by date range
    List<TicketModel> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    // Search by title or description (text search)
    @Query("{'$or': [{'title': {$regex: ?0, $options: 'i'}}, " +
           "{'description': {$regex: ?0, $options: 'i'}}]}")
    List<TicketModel> searchByKeyword(String keyword);

    // Find by category and status
    List<TicketModel> findByCategoryAndStatus(String category, String status);

    // Count tickets by assignee
    long countByAssignedToAndStatusIn(String technicianId, List<String> statuses);

}
