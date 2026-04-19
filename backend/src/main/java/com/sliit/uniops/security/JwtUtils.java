package com.sliit.uniops.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
//import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.security.Key;
import java.util.Date;
//import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Utility class for JSON Web Token operations.
 */
@Component
public class JwtUtils {

    @Value("${jwt.secret:defaultSecretKeyWithAtLeast64CharactersLongForHS512Algorithm}")
    private String secret;

    @Value("${jwt.expiration:86400000}") // 24 hours in ms
    private long jwtExpiration;

    private Key signingKey;

    @PostConstruct
    public void init() {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String extractUsername(String token) {
        try {
            Claims claims = extractAllClaims(token);
            System.out.println("DEBUG: JWT Claims: " + claims.toString());
            String subject = claims.getSubject();
            System.out.println("DEBUG: JWT Subject: " + subject);
            
            // If subject is null, try to get username from claims
            if (subject == null) {
                subject = (String) claims.get("username");
                System.out.println("DEBUG: Username from claims: " + subject);
            }
            
            return subject;
        } catch (Exception e) {
            System.out.println("DEBUG: Error extracting username from JWT: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public String generateToken(String subject, Map<String, Object> extraClaims) {
        // Ensure username is included in claims
        if (extraClaims != null && !extraClaims.containsKey("username")) {
            extraClaims.put("username", subject);
        }
        
        System.out.println("DEBUG: JWT Generation - subject: " + subject);
        System.out.println("DEBUG: JWT Generation - extraClaims: " + extraClaims);
        
        String token = Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(signingKey, SignatureAlgorithm.HS512)
                .compact();
                
        System.out.println("DEBUG: JWT Generation - token generated successfully");
        return token;
    }

    public Boolean validateToken(String token, String expectedUsername) {
        final String tokenUsername = extractUsername(token);
        return (tokenUsername.equalsIgnoreCase(expectedUsername) && !isTokenExpired(token));
    }

    public Boolean validateToken(String token, String... allowedSubjects) {
        final String tokenSubject = extractUsername(token);
        if (tokenSubject == null || isTokenExpired(token)) {
            return false;
        }

        for (String allowedSubject : allowedSubjects) {
            if (allowedSubject != null && tokenSubject.equalsIgnoreCase(allowedSubject)) {
                return true;
            }
        }

        return false;
    }

    public Key getSigningKey() {
        return signingKey;
    }
}
