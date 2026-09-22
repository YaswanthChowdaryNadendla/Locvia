package com.locvia.config;

import com.locvia.security.CustomUserDetailsService;
import com.locvia.security.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
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

import com.fasterxml.jackson.databind.ObjectMapper;
import com.locvia.dto.ApiErrorResponse;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * Spring Security 6 configuration for stateless JWT-based authentication.
 * Enforces stateless sessions, BCrypt password hashing, and role-based access.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomUserDetailsService userDetailsService;
    private final String allowedOrigins;
    private final ObjectMapper objectMapper;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            CustomUserDetailsService userDetailsService,
            @Value("${locvia.cors.allowed-origins:http://localhost:5173}") String allowedOrigins,
            ObjectMapper objectMapper) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.userDetailsService = userDetailsService;
        this.allowedOrigins = allowedOrigins;
        this.objectMapper = objectMapper;
    }

    /**
     * Configures the HTTP security filter chain.
     * CSRF is disabled because authentication relies on stateless Bearer tokens.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Disable CSRF for stateless REST APIs using JWT tokens
                .csrf(AbstractHttpConfigurer::disable)
                // Configure CORS support integrated with Spring Security
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // Enforce stateless session management (no HTTP session created or used)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // Configure URL authorization
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers("/api/health").permitAll()
                        .requestMatchers("/api/auth/register", "/api/auth/login", "/api/auth/google").permitAll()
                        .requestMatchers(
                                "/api/auth/verify-email",
                                "/api/auth/verify-signup-email",
                                "/api/auth/resend-verification",
                                "/api/auth/resend-signup-otp"
                        ).permitAll()
                        // Password-reset endpoints — public (unauthenticated users need these)
                        .requestMatchers("/api/auth/forgot-password", "/api/auth/verify-reset-otp", "/api/auth/reset-password").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/payments/razorpay/webhook").permitAll()
                        .requestMatchers("/error").permitAll()
                        // Public shop discovery (list and numeric ID lookup)
                        .requestMatchers(HttpMethod.GET, "/api/shops", "/api/shops/{id:[0-9]+}").permitAll()
                        // Public category discovery (list and numeric ID lookup)
                        .requestMatchers(HttpMethod.GET, "/api/categories", "/api/categories/{id:[0-9]+}").permitAll()
                        // Public product discovery (list and numeric ID lookup)
                        .requestMatchers(HttpMethod.GET, "/api/products", "/api/products/{id:[0-9]+}").permitAll()
                        // Public inventory stock availability
                        .requestMatchers(HttpMethod.GET, "/api/products/{productId:[0-9]+}/inventory").permitAll()
                        // Admin endpoints require ROLE_ADMIN
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        // Shop owner endpoints require ROLE_SHOP_OWNER
                        .requestMatchers("/api/shops/my", "/api/shops/my/**").hasRole("SHOP_OWNER")
                        .requestMatchers(HttpMethod.POST, "/api/shops").hasRole("SHOP_OWNER")
                        .requestMatchers(HttpMethod.PUT, "/api/shops/**").hasRole("SHOP_OWNER")
                        // Shop-scoped product management
                        .requestMatchers("/api/shops/{shopId:[0-9]+}/products", "/api/shops/{shopId:[0-9]+}/products/**").hasAnyRole("SHOP_OWNER", "ADMIN")
                        // Shop-scoped inventory management
                        .requestMatchers("/api/shops/{shopId:[0-9]+}/inventory", "/api/shops/{shopId:[0-9]+}/inventory/**").hasAnyRole("SHOP_OWNER", "ADMIN")
                        // Product management and image upload
                        .requestMatchers(HttpMethod.GET, "/api/products/{id:[0-9]+}/manage").hasAnyRole("SHOP_OWNER", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/products/{id:[0-9]+}").hasAnyRole("SHOP_OWNER", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/products/{id:[0-9]+}").hasAnyRole("SHOP_OWNER", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/products/{id:[0-9]+}/image").hasAnyRole("SHOP_OWNER", "ADMIN")
                        // Product-scoped inventory management
                        .requestMatchers("/api/products/{productId:[0-9]+}/inventory/manage").hasAnyRole("SHOP_OWNER", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/products/{productId:[0-9]+}/inventory").hasAnyRole("SHOP_OWNER", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/products/{productId:[0-9]+}/inventory").hasAnyRole("SHOP_OWNER", "ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/products/{productId:[0-9]+}/inventory/quantity").hasAnyRole("SHOP_OWNER", "ADMIN")
                        // Customer delivery address management
                        .requestMatchers("/api/addresses", "/api/addresses/**").hasRole("CUSTOMER")
                        // Customer shopping cart management
                        .requestMatchers("/api/cart", "/api/cart/**").hasRole("CUSTOMER")
                        // Customer orders management
                        .requestMatchers("/api/orders", "/api/orders/**").hasRole("CUSTOMER")
                        // Customer payment management
                        .requestMatchers("/api/payments", "/api/payments/**").hasRole("CUSTOMER")
                        // Delivery partner dashboard and requests
                        .requestMatchers("/api/delivery/requests", "/api/delivery/active", "/api/delivery/completed").hasRole("DELIVERY_PARTNER")
                        // Delivery partner & admin delivery details and status updates
                        .requestMatchers("/api/delivery", "/api/delivery/**").hasAnyRole("DELIVERY_PARTNER", "ADMIN")
                        // User management endpoints require authentication
                        .requestMatchers("/api/users/**").authenticated()
                        // All other endpoints require authentication by default
                        .anyRequest().authenticated()
                )
                // Handle unauthenticated entry point with 401 and access denied with 403
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json");
                            ApiErrorResponse body = new ApiErrorResponse(
                                    HttpServletResponse.SC_UNAUTHORIZED,
                                    "Unauthorized",
                                    "Authentication is required",
                                    request.getRequestURI()
                            );
                            objectMapper.writeValue(response.getOutputStream(), body);
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType("application/json");
                            ApiErrorResponse body = new ApiErrorResponse(
                                    HttpServletResponse.SC_FORBIDDEN,
                                    "Forbidden",
                                    "Access denied: insufficient permissions",
                                    request.getRequestURI()
                            );
                            objectMapper.writeValue(response.getOutputStream(), body);
                        })
                )
                // Register custom DaoAuthenticationProvider and JWT filter
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Password encoder bean using standard BCrypt hashing algorithm.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Data access object authentication provider linked to CustomUserDetailsService.
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    /**
     * AuthenticationManager bean retrieved from Spring Security AuthenticationConfiguration.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * CORS configuration source matching frontend origin and standard REST methods.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}
