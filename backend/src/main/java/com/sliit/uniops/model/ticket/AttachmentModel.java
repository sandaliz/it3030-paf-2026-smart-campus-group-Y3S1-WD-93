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
    private String id;
    private String ticketId;
    private String fileName;
    private String fileType;
    private String base64Content;
    private String fileUrl;

    @CreatedDate
    private LocalDateTime uploadedAt;
    private String uploadedBy;
    
     

}
