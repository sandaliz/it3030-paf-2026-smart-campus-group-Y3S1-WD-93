package com.sliit.uniops.model;

public enum Role {
    USER("USER"),
    TECHNICIAN("TECHNICIAN"),
    ADMIN("ADMIN");
    
    private final String value;
    
    Role(String value) {
        this.value = value;
    }
    
    public String getValue() {
        return value;
    }
}
