package com.sliit.uniops.util.enums;


public enum TicketCategory {
    ELECTRICAL("Electrical"),
    PLUMBING("Plumbing"),
    IT("IT Equipment"),
    HVAC("HVAC"),
    FURNITURE("Furniture"),
    CLEANING("Cleaning"),
    SECURITY("Security"),
    OTHER("Other");
    
    private final String displayName;
    
    TicketCategory(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}