import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CommentResponseDTO {
    private String id;
    private String ticketId;
    private String authorId;
    private String authorName;
    private String content;
    private boolean isInternal;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean isEdited;

}
