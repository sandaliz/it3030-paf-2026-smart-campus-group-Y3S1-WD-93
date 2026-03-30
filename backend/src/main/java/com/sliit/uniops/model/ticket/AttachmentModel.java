import java.time.LocalDateTime;
import lombok.*;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;



@Document(collection = "attachments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentModel {
    @Id
    private Long id;
    private Long ticketId;
    private String fileName;
    private String fileType;
    private long fileSize;
    private String fileUrl;

    @CreatedDate
    private LocalDateTime uploadedAt;
    private Long uploadedBy;
    
     

}
