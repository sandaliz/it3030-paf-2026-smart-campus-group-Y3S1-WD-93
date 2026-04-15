package com.sliit.uniops.exception;

public class ResourceUnavailableException extends RuntimeException {
    
    public ResourceUnavailableException(String message) {
        super(message);
    }
    
    public ResourceUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
    
    public ResourceUnavailableException(String resourceName, String resourceId) {
        super(String.format("%s with ID '%s' is currently unavailable", resourceName, resourceId));
    }
    
    public ResourceUnavailableException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s with %s '%s' is currently unavailable", resourceName, fieldName, fieldValue));
    }
}