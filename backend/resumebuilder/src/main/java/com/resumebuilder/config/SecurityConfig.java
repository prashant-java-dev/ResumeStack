package com.resumebuilder.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    @Autowired
    private JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(request -> {
                var corsConfiguration = new org.springframework.web.cors.CorsConfiguration();
                corsConfiguration.setAllowedOriginPatterns(java.util.List.of("*"));
                corsConfiguration.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
                corsConfiguration.setAllowedHeaders(java.util.List.of("*"));
                corsConfiguration.setExposedHeaders(java.util.List.of("Authorization"));
                corsConfiguration.setAllowCredentials(true);
                return corsConfiguration;
            }))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .exceptionHandling(ex -> ex.authenticationEntryPoint(
                (request, response, authException) -> response.sendError(401, "Unauthorized: " + authException.getMessage())
            ))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                        "/api/auth/login",
                        "/api/auth/register",
                        "/actuator/health",
                        "/v3/api-docs/**", // Swagger
                        "/swagger-ui/**"
                ).permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
