package com.sliit.uniops.dto.response.ticket;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Set;

@Data
@Builder
public class TechnicianRecommendationDTO {
    private String id;
    private String name;
    private String email;
    private Set<String> skills;
    private int activeTicketCount;
    private int matchScore;
    private boolean recommended;
    private boolean alreadyAssigned;
    private boolean available;
    private List<String> reasons;
}
