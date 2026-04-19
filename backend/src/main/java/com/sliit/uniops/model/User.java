package com.sliit.uniops.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.HashSet;
import java.util.Set;

/**
 * Represents a system user, synchronized with Google OAuth details.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    private String id;

    private String googleId; // Unique ID from Google

    private String username;

    @JsonIgnore
    private String password;

    private String email;

    private String name;

    private String pictureUrl;

    @Builder.Default
    private String authProvider = "LOCAL";

    @Builder.Default
    private boolean enabled = true;

    @Builder.Default
    private Long createdAt = System.currentTimeMillis();

    private Long lastLoginAt;

    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    @Builder.Default
    private Set<String> technicianSkills = new HashSet<>();
}
