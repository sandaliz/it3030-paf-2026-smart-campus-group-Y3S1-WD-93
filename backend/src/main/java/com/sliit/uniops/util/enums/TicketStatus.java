package com.sliit.uniops.util.enums;


public enum TicketStatus {
    OPEN("Open"),
    IN_PROGRESS("In Progress"),
    RESOLVED("Resolved"),
    PENDING_CONFIRMATION("Pending Confirmation"),
    CLOSED("Closed"),
    REJECTED("Rejected");
    
    private final String displayName;
    
    TicketStatus(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public boolean canTransitionTo(TicketStatus newStatus) {
        switch (this) {
            case OPEN:
                return newStatus == IN_PROGRESS || newStatus == REJECTED;
            case IN_PROGRESS:
                return newStatus == RESOLVED || newStatus == REJECTED;
            case RESOLVED:
                return newStatus == PENDING_CONFIRMATION || newStatus == CLOSED;
            case PENDING_CONFIRMATION:
                return newStatus == CLOSED || newStatus == IN_PROGRESS; // Allow reopening if needed
            case REJECTED:
                return false;
            case CLOSED:
                return false;
            default:
                return false;
        }
    }
    
    // Get all valid next statuses
    public TicketStatus[] getNextStatuses() {
        switch (this) {
            case OPEN:
                return new TicketStatus[]{IN_PROGRESS, REJECTED};
            case IN_PROGRESS:
                return new TicketStatus[]{RESOLVED, REJECTED};
            case RESOLVED:
                return new TicketStatus[]{PENDING_CONFIRMATION, CLOSED};
            case PENDING_CONFIRMATION:
                return new TicketStatus[]{CLOSED, IN_PROGRESS}; // Allow reopening or final closure
            default:
                return new TicketStatus[]{};
        }
    }
}
