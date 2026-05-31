package com.scholarlinkgh.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.scholarlinkgh.service.JwtService;
import org.springframework.lang.NonNull;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final ObjectMapper objectMapper;
    private UserDetailsService userDetailsService;

    // JwtService and ObjectMapper injected normally
    public JwtAuthFilter(JwtService jwtService, ObjectMapper objectMapper) {
        this.jwtService = jwtService;
        this.objectMapper = objectMapper;
    }

    // UserDetailsService injected lazily to break the circular dependency
    // SecurityConfig defines UserDetailsService, SecurityConfig needs JwtAuthFilter
    // @Lazy tells Spring: don't inject this until first use, not at startup
    @Autowired
    public void setUserDetailsService(@Lazy UserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            final String jwt = authHeader.substring(7);

            if (!isWellFormedToken(jwt)) {
                sendUnauthorizedResponse(response, "Invalid token format");
                return;
            }

            final String userEmail = jwtService.extractEmail(jwt);

            if (userEmail != null &&
                SecurityContextHolder.getContext().getAuthentication() == null) {

                UserDetails userDetails =
                    userDetailsService.loadUserByUsername(userEmail);

                if (jwtService.isTokenValid(jwt, userDetails)) {

                    UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                        );

                    authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                    );

                    SecurityContextHolder.getContext().setAuthentication(authToken);

                } else {
                    SecurityContextHolder.clearContext();
                    sendUnauthorizedResponse(response, "Token is invalid or expired");
                    return;
                }
            }

            filterChain.doFilter(request, response);

        } catch (Exception ex) {
            log.error("JWT authentication failed for request [{}]: {}",
                request.getRequestURI(), ex.getMessage());
            SecurityContextHolder.clearContext();
            sendUnauthorizedResponse(response, "Authentication failed");
        }
    }

    private boolean isWellFormedToken(String token) {
        if (token == null || token.isBlank()) return false;
        String[] parts = token.split("\\.");
        return parts.length == 3 &&
               parts[0].length() > 0 &&
               parts[1].length() > 0 &&
               parts[2].length() > 0;
    }

    private void sendUnauthorizedResponse(
            HttpServletResponse response,
            String message) throws IOException {

        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        Map<String, Object> body = Map.of(
            "status", 401,
            "error", "Unauthorized",
            "message", message
        );

        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}