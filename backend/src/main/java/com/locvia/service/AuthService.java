package com.locvia.service;

import com.locvia.dto.AuthResponse;
import com.locvia.dto.LoginRequest;
import com.locvia.dto.RegisterRequest;
import com.locvia.dto.UserSummaryDto;
import com.locvia.entity.AccountStatus;
import com.locvia.entity.User;
import com.locvia.entity.UserRole;
import com.locvia.exception.EmailAlreadyExistsException;
import com.locvia.repository.UserRepository;
import com.locvia.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Authentication service orchestrating registration, login, password hashing,
 * and JWT generation.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    /**
     * Registers a new platform user with BCrypt password hashing.
     * Rejects attempts to publicly register with the ADMIN role.
     * SHOP_OWNER and DELIVERY_PARTNER accounts are created with PENDING status
     * and require Admin approval before performing operational actions.
     *
     * @param request registration payload
     * @return AuthResponse with JWT and safe user details
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new EmailAlreadyExistsException("Email is already registered: " + normalizedEmail);
        }

        // Security check: ADMIN cannot be registered publicly
        if (request.getRole() == UserRole.ADMIN) {
            throw new SecurityException("Administrator accounts cannot be created via public registration");
        }

        // Default role is CUSTOMER if not specified
        UserRole assignedRole = request.getRole() != null ? request.getRole() : UserRole.CUSTOMER;

        // Determine approval status based on role:
        // SHOP_OWNER and DELIVERY_PARTNER must be approved by Admin before operating.
        // CUSTOMER accounts are immediately active.
        AccountStatus accountStatus = switch (assignedRole) {
            case SHOP_OWNER, DELIVERY_PARTNER -> AccountStatus.PENDING;
            default -> AccountStatus.APPROVED;
        };

        String hashedPassword = passwordEncoder.encode(request.getPassword());

        String phone = request.getPhone() != null ? request.getPhone().trim() : null;
        User user = new User(
                request.getName().trim(),
                normalizedEmail,
                phone,
                hashedPassword,
                assignedRole
        );
        user.setAccountStatus(accountStatus);

        User savedUser = userRepository.save(user);

        String token = jwtService.generateToken(
                savedUser.getEmail(),
                savedUser.getId(),
                savedUser.getRole().name()
        );

        return new AuthResponse(token, UserSummaryDto.fromEntity(savedUser));
    }

    /**
     * Authenticates existing user credentials and issues a JWT token.
     *
     * @param request login payload
     * @return AuthResponse with JWT and safe user details
     */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());

        // Perform authentication check via AuthenticationManager & DaoAuthenticationProvider
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword())
        );

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + normalizedEmail));

        String token = jwtService.generateToken(
                user.getEmail(),
                user.getId(),
                user.getRole().name()
        );

        return new AuthResponse(token, UserSummaryDto.fromEntity(user));
    }

    /**
     * Fetches safe user summary for the currently authenticated principal.
     *
     * @param email normalized user email
     * @return UserSummaryDto
     */
    @Transactional(readOnly = true)
    public UserSummaryDto getCurrentUserSummary(String email) {
        String normalizedEmail = normalizeEmail(email);
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + normalizedEmail));
        return UserSummaryDto.fromEntity(user);
    }

    private String normalizeEmail(String email) {
        if (email == null) return "";
        return email.trim().toLowerCase();
    }
}
