package com.sliit.uniops.repository.ticket;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.sliit.uniops.model.ticket.AttachmentModel;

import java.util.List;

@Repository
public interface AttachmentRepository extends MongoRepository<AttachmentModel, String> {

     @Query("{'ticketId': ?0, 'isDeleted': false}")
    List<AttachmentModel> findByTicketIdAndIsDeletedFalse(String ticketId);
    
    long countByTicketId(String ticketId);
    
    @Query(value = "{'ticketId': ?0, 'isDeleted': false}", count = true)
    long countActiveByTicketId(String ticketId);
    
    void deleteByTicketId(String ticketId);
}