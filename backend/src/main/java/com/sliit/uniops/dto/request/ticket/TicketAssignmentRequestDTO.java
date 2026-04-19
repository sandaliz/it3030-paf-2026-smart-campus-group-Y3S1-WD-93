package com.sliit.uniops.dto.request.ticket;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class TicketAssignmentRequestDTO {
    @NotEmpty(message = "At least one technician must be selected")
    private List<String> technicianIds;
}
