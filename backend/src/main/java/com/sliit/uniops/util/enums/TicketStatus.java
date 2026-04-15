package com.sliit.uniops.util.enums;


public enum TicketStatus {
    OPEN("Open"),
    IN_PROGRESS("In Progress"),
    RESOLVED("Resolved"),
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
                return newStatus == RESOLVED;
            case RESOLVED:
                return newStatus == CLOSED;
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
                return new TicketStatus[]{RESOLVED};
            case RESOLVED:
                return new TicketStatus[]{CLOSED};
            default:
                return new TicketStatus[]{};
        }
    }
}
