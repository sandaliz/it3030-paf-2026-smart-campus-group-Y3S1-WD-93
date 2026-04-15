package com.sliit.uniops.repository.ticket;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import com.sliit.uniops.model.ticket.CommentModel;
import org.springframework.data.mongodb.repository.Query;



@Repository
public interface CommentRepository extends MongoRepository<CommentModel, String>{
    // Get all comments for a ticket (excluding deleted)
    @Query("{'ticketId': ?0, 'isDeleted': false}")
    List<CommentModel> findByTicketIdAndNotDeleted(String ticketId);
    
    // Get all comments for a ticket (including deleted for admins)
    List<CommentModel> findByTicketId(String ticketId);
    
    // Get public comments only
    @Query("{'ticketId': ?0, 'isInternal': false, 'isDeleted': false}")
    List<CommentModel> findPublicCommentsByTicketId(String ticketId);
    
    // Get internal comments only (admin/technician)
    @Query("{'ticketId': ?0, 'isInternal': true, 'isDeleted': false}")
    List<CommentModel> findInternalCommentsByTicketId(String ticketId);
    
    // Get comments by author
    List<CommentModel> findByAuthorId(String authorId);
    
    // Get recent comments
    @Query("{'ticketId': ?0, 'isDeleted': false}")
    Page<CommentModel> findByTicketIdWithPagination(String ticketId, Pageable pageable);
    
    // Count comments by ticket
    long countByTicketIdAndIsDeletedFalse(String ticketId);
    
    // Count internal comments
    long countByTicketIdAndIsInternalTrueAndIsDeletedFalse(String ticketId);
    
    // Find comments created within last N hours
    @Query("{'createdAt': {$gte: ?0}, 'isDeleted': false}")
    List<CommentModel> findRecentComments(LocalDateTime since);
    
    // Delete all comments for a ticket (when ticket is deleted)
    void deleteByTicketId(String ticketId);
}