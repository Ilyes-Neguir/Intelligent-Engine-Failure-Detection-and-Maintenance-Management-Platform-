package com.pfe.backend.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        .requestMatchers("/api/auth/**").permitAll()

                        .requestMatchers(HttpMethod.POST, "/api/vehicles/**").hasAuthority("CLIENT")
                        .requestMatchers(HttpMethod.PUT, "/api/vehicles/**").hasAuthority("CLIENT")
                        .requestMatchers(HttpMethod.DELETE, "/api/vehicles/**").hasAuthority("CLIENT")
                        .requestMatchers(HttpMethod.GET, "/api/vehicles/**").hasAnyAuthority("CLIENT", "MECHANIC")

                        .requestMatchers(HttpMethod.POST, "/api/bookings/**").hasAnyAuthority("CLIENT", "MECHANIC")
                        .requestMatchers(HttpMethod.GET, "/api/bookings/**").hasAnyAuthority("CLIENT", "MECHANIC")

                        .requestMatchers(HttpMethod.POST, "/api/diagnostic/**").hasAuthority("MECHANIC")
                        .requestMatchers(HttpMethod.GET, "/api/diagnostic/**").hasAnyAuthority("CLIENT", "MECHANIC")

                        .requestMatchers("/api/reports/**").hasAnyAuthority("CLIENT", "MECHANIC")
                        .requestMatchers("/api/ml/**").hasAnyAuthority("CLIENT", "MECHANIC")
                        .requestMatchers(HttpMethod.POST, "/api/emails/**").hasAnyAuthority("CLIENT", "MECHANIC")
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://localhost:3000"
        ));

        configuration.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
        ));

        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}