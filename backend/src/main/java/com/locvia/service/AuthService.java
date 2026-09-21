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
import com.locvia.security.CustomUserDetails;
import com.locvia.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.locvia.dto.RegisterResponse;
import com.locvia.exception.BusinessException;
import org.springframework.http.HttpStatus;

/**
 * Service orchestrating user authentication flows:
 * public registration with BCrypt hashing and email verification OTP,
 * login with credential validation and JWT issuance,
 * and profile retrieval.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailVerificationService emailVerificationService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            EmailVerificationService emailVerificationService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.emailVerificationService = emailVerificationService;
    }

    /**
     * Registers a new platform user with BCrypt password hashing and emailVerified = false.
     * Rejects attempts to publicly register with the ADMIN role.
     * SHOP_OWNER and DELIVERY_PARTNER accounts are created with PENDING status.
     * Generates a 6-digit OTP and dispatches it via Resend for email verification.
     *
     * @param request registration payload
     * @return RegisterResponse indicating email verification is required
     */
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
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
        user.setEmailVerified(false);

        User savedUser = userRepository.save(user);

        // Generate and dispatch verification OTP via Resend
        emailVerificationService.generateAndSendOtp(savedUser.getEmail());

        return new RegisterResponse(
                "Verification code sent to your email",
                true,
                savedUser.getEmail(),
                UserSummaryDto.fromEntity(savedUser)
        );
    }

    /**
     * Authenticates existing user credentials and issues a JWT token.
     * The AuthenticationManager already loaded the user from the database via
     * CustomUserDetailsService during DaoAuthenticationProvider.authenticate().
     * We extract the principal directly from the returned Authentication object
     * to avoid a redundant second WAN round-trip to Aiven MySQL.
     *
     * Enforces that the user has verified their email address before issuing a token.
     *
     * @param request login payload
     * @return AuthResponse with JWT and safe user details
     */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());

        // authenticate() loads + verifies the user; returns Authentication with CustomUserDetails principal
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword())
        );

        // Extract user data from the authenticated principal (already loaded by DaoAuthenticationProvider)
        CustomUserDetails principal = (CustomUserDetails) authentication.getPrincipal();

        // Enforce email verification
        if (!principal.isEmailVerified()) {
            throw new BusinessException("Please verify your email before logging in.", HttpStatus.FORBIDDEN);
        }

        String token = jwtService.generateToken(
                principal.getEmail(),
                principal.getId(),
                principal.getRole().name()
        );

        // Build UserSummaryDto from principal — no extra DB query needed
        UserSummaryDto userSummary = new UserSummaryDto(
                principal.getId(),
                principal.getName(),
                principal.getEmail(),
                principal.getPhone(),
                principal.getRole(),
                principal.getAccountStatus()
        );

        return new AuthResponse(token, userSummary);
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
