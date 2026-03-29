package com.sliit.uniops.util;

public class TicketConstants {
    // Status Constants
    public static final String STATUS_OPEN = "OPEN";
    public static final String STATUS_IN_PROGRESS = "IN_PROGRESS";
    public static final String STATUS_RESOLVED = "RESOLVED";
    public static final String STATUS_CLOSED = "CLOSED";
    public static final String STATUS_REJECTED = "REJECTED";
    
    // Priority Constants
    public static final String PRIORITY_LOW = "LOW";
    public static final String PRIORITY_MEDIUM = "MEDIUM";
    public static final String PRIORITY_HIGH = "HIGH";
    public static final String PRIORITY_URGENT = "URGENT";
    
    // Category Constants
    public static final String CATEGORY_ELECTRICAL = "ELECTRICAL";
    public static final String CATEGORY_PLUMBING = "PLUMBING";
    public static final String CATEGORY_IT = "IT";
    public static final String CATEGORY_HVAC = "HVAC";
    public static final String CATEGORY_FURNITURE = "FURNITURE";
    public static final String CATEGORY_CLEANING = "CLEANING";
    public static final String CATEGORY_SECURITY = "SECURITY";
    public static final String CATEGORY_OTHER = "OTHER";
    
    // Valid statuses for validation
    public static final java.util.Set<String> VALID_STATUSES = java.util.Set.of(
        STATUS_OPEN, STATUS_IN_PROGRESS, STATUS_RESOLVED, STATUS_CLOSED, STATUS_REJECTED
    );
    
    // Valid priorities for validation
    public static final java.util.Set<String> VALID_PRIORITIES = java.util.Set.of(
        PRIORITY_LOW, PRIORITY_MEDIUM, PRIORITY_HIGH, PRIORITY_URGENT
    );
    
    // Valid categories for validation
    public static final java.util.Set<String> VALID_CATEGORIES = java.util.Set.of(
        CATEGORY_ELECTRICAL, CATEGORY_PLUMBING, CATEGORY_IT, CATEGORY_HVAC,
        CATEGORY_FURNITURE, CATEGORY_CLEANING, CATEGORY_SECURITY, CATEGORY_OTHER
    );
}
