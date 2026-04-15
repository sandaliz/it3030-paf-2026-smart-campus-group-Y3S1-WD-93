package com.sliit.uniops.util.enums;


public enum TicketPriority {
    LOW("Low", 0),
    MEDIUM("Medium", 1),
    HIGH("High", 2),
    URGENT("Urgent", 3);
    
    private final String displayName;
    private final int level;
    
    TicketPriority(String displayName, int level) {
        this.displayName = displayName;
        this.level = level;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public int getLevel() {
        return level;
    }
    
    public static TicketPriority fromLevel(int level) {
        for (TicketPriority priority : values()) {
            if (priority.level == level) {
                return priority;
            }
        }
        return MEDIUM;
    }
}
