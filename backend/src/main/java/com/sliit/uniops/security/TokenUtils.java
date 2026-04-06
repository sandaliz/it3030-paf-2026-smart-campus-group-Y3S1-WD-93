package com.sliit.uniops.security;

import org.springframework.stereotype.Component;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Component
public class TokenUtils {
    
    // Generate token from user data
    public String generateToken(String userId, String email, String role, String name) {
        String tokenData = String.format("%s|%s|%s|%s|%d", 
            userId, email, role, name, System.currentTimeMillis());
        return Base64.getEncoder().encodeToString(tokenData.getBytes());
    }
    
    // Decode token
    public Map<String, String> decodeToken(String token) {
        Map<String, String> data = new HashMap<>();
        try {
            String decoded = new String(Base64.getDecoder().decode(token));
            String[] parts = decoded.split("\\|");
            
            if (parts.length >= 4) {
                data.put("userId", parts[0]);
                data.put("email", parts[1]);
                data.put("role", parts[2]);
                data.put("name", parts[3]);
                data.put("timestamp", parts.length > 4 ? parts[4] : "");
            }
        } catch (Exception e) {
            data.put("error", "Invalid token");
        }
        return data;
    }
    
    // Validate token
    public boolean validateToken(String token) {
        try {
            String decoded = new String(Base64.getDecoder().decode(token));
            return decoded.split("\\|").length >= 4;
        } catch (Exception e) {
            return false;
        }
    }
    
    public String getUserIdFromToken(String token) {
        return decodeToken(token).getOrDefault("userId", "");
    }
    
    public String getEmailFromToken(String token) {
        return decodeToken(token).getOrDefault("email", "");
    }
    
    public String getRoleFromToken(String token) {
        return decodeToken(token).getOrDefault("role", "");
    }
    
    public String getNameFromToken(String token) {
        return decodeToken(token).getOrDefault("name", "");
    }
}