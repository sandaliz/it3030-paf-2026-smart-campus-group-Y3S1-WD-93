package com.sliit.uniops.repository.ticket;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import com.sliit.uniops.model.ticket.NotificationModel;

@Repository
public interface NotificationRepository extends MongoRepository<NotificationModel, String> {

    List<NotificationModel> findByUserIdOrderByCreatedAtDesc(String userId);

    List<NotificationModel> findByUserIdAndIsReadFalse(String userId);

    long countByUserIdAndIsReadFalse(String userId);

    void deleteByUserId(String userId);
}
