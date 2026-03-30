package com.sliit.uniops.controller;

import com.sliit.uniops.dto.response.LoginResponseDTO;
import com.sliit.uniops.dto.request.UserDTO;
import com.sliit.uniops.model.User;
import com.sliit.uniops.repository.UserRepository;
import com.sliit.uniops.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor

public class AuthController {
    
    private final JwtService jwtService;
    private final UserRepository userRepository;
    
    @PostMapping("/google")
    public ResponseEntity<LoginResponseDTO> googleLogin(@RequestBody Map<String, String> payload) {
        // This endpoint expects the Google token from frontend
        String googleToken = payload.get("token");
        
        // In production, verify the token with Google
        // For now, we'll assume the token is valid
        
        // You would typically decode the token and get user info
        // Then find or create user in database
        
        return ResponseEntity.ok(LoginResponseDTO.builder()
            .message("Login successful")
            .build());
    }
    
    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser(@AuthenticationPrincipal OidcUser user) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        
        // Get user from database
        User dbUser = userRepository.findByEmail(user.getEmail())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        UserDTO userDTO = UserDTO.builder()
            .id(dbUser.getId())
            .email(dbUser.getEmail())
            .name(dbUser.getName())
            .picture(dbUser.getPicture())
            .role(dbUser.getRole().getValue())
            .department(dbUser.getDepartment())
            .phoneNumber(dbUser.getPhoneNumber())
            .build();
        
        return ResponseEntity.ok(userDTO);
    }
    
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Logged out successfully");
        return ResponseEntity.ok(response);
    }
}