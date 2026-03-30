package com.sliit.uniops.model;

import com.sliit.uniops.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    
    @Id
    private String id;
    
    @Indexed(unique = true)
    private String email;
    
    private String name;
    
    private String picture;
    
    private String googleId;
    
    private Role role;
    
    private boolean isActive;
    
    private String department;  // For technicians
    
    private String phoneNumber;  // For contact
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    private LocalDateTime lastLoginAt;
}