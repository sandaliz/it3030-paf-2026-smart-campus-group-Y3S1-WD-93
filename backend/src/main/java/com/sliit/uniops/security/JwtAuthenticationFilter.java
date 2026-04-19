package com.sliit.uniops.security;

import com.sliit.uniops.model.User;
import com.sliit.uniops.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import com.sliit.uniops.security.UserPrincipal;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.stream.Collectors;

/**
 * Filter that intercepts every request to check for a valid JWT token.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String username;

        // 1. Check if the header contains Bearer token
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Extract JWT and Email from token
        jwt = authHeader.substring(7);
        String extractedUsername = null;
        try {
            extractedUsername = jwtUtils.extractUsername(jwt);
            System.out.println("DEBUG: Extracted username from JWT: " + extractedUsername);

            // If username is null, try to extract from JWT claims directly
            if (extractedUsername == null) {
                try {
                    Claims claims = Jwts.parserBuilder()
                            .setSigningKey(jwtUtils.getSigningKey())
                            .build()
                            .parseClaimsJws(jwt)
                            .getBody();
                    
                    // Try to get username from claims
                    extractedUsername = (String) claims.get("username");
                    System.out.println("DEBUG: Extracted username from JWT claims: " + extractedUsername);
                    
                    // If still null, try email
                    if (extractedUsername == null) {
                        extractedUsername = (String) claims.get("email");
                        System.out.println("DEBUG: Extracted username from JWT email: " + extractedUsername);
                    }
                } catch (Exception e) {
                    System.out.println("DEBUG: Error extracting username from JWT claims: " + e.getMessage());
                }
            }
            
            username = extractedUsername;

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                String normalizedSubject = username.toLowerCase();
                User user = userRepository.findByUsername(normalizedSubject)
                        .or(() -> userRepository.findByEmail(normalizedSubject))
                        .orElse(null);

                // 4. Validate token and set security context
                if (user != null && jwtUtils.validateToken(jwt, normalizedSubject, user.getUsername(), user.getEmail())) {
                    // Create UserPrincipal instead of using User directly
                    UserPrincipal userPrincipal = new UserPrincipal(
                            user.getId(),
                            user.getEmail(),
                            user.getName(),
                            user.getRoles().isEmpty()
                                ? java.util.Set.of("USER")
                                : user.getRoles().stream().map(Enum::name).collect(Collectors.toSet())
                    );
                    
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userPrincipal,
                            null,
                            userPrincipal.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            // If token is invalid/expired, we just let it go for now (anyRequest().authenticated() will catch it later)
            log.error("Could not set user authentication in security context", e);
        }

        filterChain.doFilter(request, response);
    }
}
