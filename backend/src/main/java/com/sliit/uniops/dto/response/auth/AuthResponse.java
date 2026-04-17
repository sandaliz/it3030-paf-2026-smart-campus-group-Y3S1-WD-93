package com.sliit.uniops.dto.response.auth;

import com.sliit.uniops.model.Role;
import lombok.Builder;
import lombok.Data;

import java.util.Set;

@Data
@Builder
public class AuthResponse {
    private String token;
    private String id;
    private String username;
    private String email;
    private String name;
    private String pictureUrl;
    private String authProvider;
    private Set<Role> roles;
    private String redirectPath;
}
