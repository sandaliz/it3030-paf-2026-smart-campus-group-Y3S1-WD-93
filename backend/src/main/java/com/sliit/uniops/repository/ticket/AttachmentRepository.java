import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import com.sliit.uniops.model.ticket.AttachmentModel;

import java.util.List;

@Repository
public interface AttachmentRepository extends MongoRepository<AttachmentModel, String> {

    List<AttachmentModel> findByTicketId(String ticketId);

    long countByTicketId(String ticketId);

    void deleteByTicketId(String ticketId);
}