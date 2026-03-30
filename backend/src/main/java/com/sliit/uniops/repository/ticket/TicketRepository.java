package com.sliit.uniops.repository.ticket;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.sliit.uniops.model.ticket.TicketModel;

@Repository
public interface TicketRepository extends MongoRepository<TicketModel, String> {
    

}
