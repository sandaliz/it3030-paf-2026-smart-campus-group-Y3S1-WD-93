package com.sliit.uniops.constants;

public final class ResourceErrorMessages {
    private ResourceErrorMessages() {}

    // Resource error messages
    public static final String RESOURCE_NOT_FOUND = "Resource not found with ID: %s";
    public static final String RESOURCE_UPDATE_UNAUTHORIZED = "You can only update resources you created";
    public static final String RESOURCE_STATUS_UPDATE_UNAUTHORIZED = "You can only update status of resources you created";
    public static final String RESOURCE_DELETE_UNAUTHORIZED = "You can only delete resources you created";
    public static final String RESOURCE_NOT_ACTIVE = "Resource is not active";
    public static final String NO_SCHEDULE_RESTRICTIONS = "No schedule restrictions configured";
    public static final String WITHIN_AVAILABILITY_WINDOW = "Within configured availability window";
    public static final String OUTSIDE_AVAILABILITY_WINDOW = "Outside configured availability window";
}
