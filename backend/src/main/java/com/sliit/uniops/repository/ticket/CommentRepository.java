import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import com.sliit.uniops.model.ticket.CommentModel;
@Repository
public interface CommentRepository extends MongoRepository<CommentModel, String>{
    List<CommentModel> findByTicketId(String ticketId);
    Page<CommentModel> findByTicketId(String ticketId, Pageable pageable);

    List<CommentModel> findByAuthorId(String authorId);

    long countByTicketId(String ticketId);
    
    void deleteByTicketId(String ticketId);
    
    List<CommentModel> findByTicketIdAndCreatedAtAfter(String ticketId, LocalDateTime since);
}