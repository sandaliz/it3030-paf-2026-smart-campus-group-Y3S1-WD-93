package com.sliit.uniops.repository.ticket;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.sliit.uniops.model.ticket.TicketModel;
import com.sliit.uniops.util.enums.TicketStatus;

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
      Page<TicketModel> findByStatus(TicketStatus status, Pageable pageable);
    List<TicketModel> findByStatus(TicketStatus status);

     // Find open tickets (for dashboard)
    @Query("{'status': {$in: ['OPEN', 'IN_PROGRESS']}, 'isDeleted': false}")
    List<TicketModel> findOpenTickets();

    // Count by status
    long countByStatus(TicketStatus status);

    // Find by date range
    List<TicketModel> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    // Search by title or description (text search)
    @Query("{'$or': [{'title': {$regex: ?0, $options: 'i'}}, " +
           "{'description': {$regex: ?0, $options: 'i'}}], 'isDeleted': false}")
    
    List<TicketModel> searchByKeyword(String keyword);

    // Find by category and status
    List<TicketModel> findByCategoryAndStatus(String category, String status);

    // Count tickets by assignee
    long countByAssignedToAndStatusIn(String technicianId, List<String> statuses);

   // Get statistics
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    long countByStatusAndCreatedAtBetween(TicketStatus status, LocalDateTime start, LocalDateTime end);
}