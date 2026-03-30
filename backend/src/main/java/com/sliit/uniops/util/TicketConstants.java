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

// ===== STATUS TRANSITION VALIDATION =====
    public static boolean canTransitionTo(String currentStatus, String newStatus) {
        if (currentStatus == null || newStatus == null) return false;

        switch (currentStatus) {
            case STATUS_OPEN:
                return STATUS_IN_PROGRESS.equals(newStatus) || STATUS_REJECTED.equals(newStatus);
            case STATUS_IN_PROGRESS:
                return STATUS_RESOLVED.equals(newStatus);
            case STATUS_RESOLVED:
                return STATUS_CLOSED.equals(newStatus);
            case STATUS_REJECTED:
                return false;
            case STATUS_CLOSED:
                return false;
            default:
                return false;
        }
    }

    // ===== GET DISPLAY NAMES =====
    public static String getStatusDisplayName(String status) {
        return switch (status) {
            case STATUS_OPEN -> "Open";
            case STATUS_IN_PROGRESS -> "In Progress";
            case STATUS_RESOLVED -> "Resolved";
            case STATUS_CLOSED -> "Closed";
            case STATUS_REJECTED -> "Rejected";
            default -> status;
        };
    }

    public static String getPriorityDisplayName(String priority) {
        return switch (priority) {
            case PRIORITY_LOW -> "Low";
            case PRIORITY_MEDIUM -> "Medium";
            case PRIORITY_HIGH -> "High";
            case PRIORITY_URGENT -> "Urgent";
            default -> priority;
        };
    }

    public static String getCategoryDisplayName(String category) {
        return switch (category) {
            case CATEGORY_ELECTRICAL -> "Electrical";
            case CATEGORY_PLUMBING -> "Plumbing";
            case CATEGORY_IT -> "IT Equipment";
            case CATEGORY_HVAC -> "HVAC";
            case CATEGORY_FURNITURE -> "Furniture";
            case CATEGORY_CLEANING -> "Cleaning";
            case CATEGORY_SECURITY -> "Security";
            case CATEGORY_OTHER -> "Other";
            default -> category;
        };
    }
}

