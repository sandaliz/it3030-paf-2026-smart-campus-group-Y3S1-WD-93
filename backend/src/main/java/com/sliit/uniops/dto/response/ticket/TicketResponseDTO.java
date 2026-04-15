package com.sliit.uniops.dto.response.ticket;

import java.time.LocalDateTime;
import java.util.List;

import com.sliit.uniops.util.enums.TicketCategory;
import com.sliit.uniops.util.enums.TicketPriority;
import com.sliit.uniops.util.enums.TicketStatus;

import lombok.*;

@Data
public class TicketResponseDTO {
     private String id;
    private String title;
    private String description;
    private TicketCategory category;
    private TicketPriority priority;
    private TicketStatus status;
    private String location;
    private String resourceId;
    private String createdBy;
    private String createdByName;
    private String assignedTo;
    private String assignedToName;
    private List<String> attachmentUrls;
    private String resolutionNotes;
    private String rejectionReason;
    private String userFeedback;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime closedAt;
    private LocalDateTime firstResponseAt;
    private long commentCount;
    private long internalCommentCount;
    private TicketStatus[] nextStatuses;
}


