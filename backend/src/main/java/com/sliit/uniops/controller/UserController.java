package com.sliit.uniops.controller;

import com.sliit.uniops.dto.request.UserDTO;
import com.sliit.uniops.model.User;
import com.sliit.uniops.model.Role;
import com.sliit.uniops.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    
    private final UserRepository userRepository;
    
    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser(@AuthenticationPrincipal OidcUser user) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        
        User dbUser = userRepository.findByEmail(user.getEmail())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        return ResponseEntity.ok(convertToDTO(dbUser));
    }
    
    @GetMapping("/technicians")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<List<UserDTO>> getAllTechnicians() {
        List<User> technicians = userRepository.findByRole(Role.TECHNICIAN);
        return ResponseEntity.ok(technicians.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList()));
    }
    
    @PatchMapping("/{userId}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDTO> updateUserRole(
            @PathVariable String userId,
            @RequestParam Role role) {
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setRole(role);
        user = userRepository.save(user);
        
        return ResponseEntity.ok(convertToDTO(user));
    }
    
    @PatchMapping("/{userId}/department")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDTO> updateUserDepartment(
            @PathVariable String userId,
            @RequestParam String department) {
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setDepartment(department);
        user = userRepository.save(user);
        
        return ResponseEntity.ok(convertToDTO(user));
    }
    
    private UserDTO convertToDTO(User user) {
        return UserDTO.builder()
            .id(user.getId())
            .email(user.getEmail())
            .name(user.getName())
            .picture(user.getPicture())
            .role(user.getRole().getValue())
            .department(user.getDepartment())
            .phoneNumber(user.getPhoneNumber())
            .build();
    }
}
