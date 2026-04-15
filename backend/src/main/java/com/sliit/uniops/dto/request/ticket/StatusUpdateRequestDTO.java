package com.sliit.uniops.dto.request.ticket;

import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class StatusUpdateRequestDTO {

    @Pattern(regexp = "OPEN|IN_PROGRESS|RESOLVED|CLOSED|REJECTED",
             message = "Invalid status value")
    private String status;

    private String reason;
}