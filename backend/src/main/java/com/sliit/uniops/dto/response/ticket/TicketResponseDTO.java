import java.time.LocalDateTime;
import java.util.List;

import lombok.*;

@Data
public class TicketResponseDTO {
    private String id;
    private String title;
    private String description;
    private String category;
    private String priority;
    private String status;
    private String location;
    private String resourceId;
    private String createdBy;
    private String createdByName;
    private String assignedTo;
    private String assignedToName;
    private List<String> attachmentUrls;
    private String resolutionNotes;
    private String rejectionReason;
    private String preferredContactMethod;
    private String contactDetails;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime closedAt;
    private long commentCount;
}


