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

import com.locvia.dto.GoogleAuthRequest;
import com.locvia.dto.RegisterResponse;
import com.locvia.exception.BusinessException;
import com.locvia.security.google.GoogleTokenPayload;
import com.locvia.security.google.GoogleTokenVerifierService;
import org.springframework.http.HttpStatus;

import java.util.Optional;
import java.util.UUID;

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
    private final GoogleTokenVerifierService googleTokenVerifierService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            EmailVerificationService emailVerificationService,
            GoogleTokenVerifierService googleTokenVerifierService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.emailVerificationService = emailVerificationService;
        this.googleTokenVerifierService = googleTokenVerifierService;
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

    /**
     * Authenticates a user using a verified Google Identity Services ID token.
     *
     * Flow:
     * 1. Cryptographically verify Google ID token signature, issuer, audience, and exp.
     * 2. Search existing user by googleSubject or normalized email.
     * 3. If found:
     *    - Enforce active status and accountStatus != REJECTED.
     *    - Link googleSubject if null.
     *    - Set emailVerified = true if false.
     *    - Preserve existing password hash, role, and approval status.
     * 4. If not found:
     *    - Create new CUSTOMER account with accountStatus = APPROVED, emailVerified = true.
     *    - Hash a random UUID as password so blank password access is prohibited.
     * 5. Issue standard Locvia JWT and return AuthResponse.
     *
     * @param request Google credential payload
     * @return AuthResponse with JWT and UserSummaryDto
     */
    @Transactional
    public AuthResponse loginWithGoogle(GoogleAuthRequest request) {
        GoogleTokenPayload payload = googleTokenVerifierService.verifyToken(request.credential());
        String normalizedEmail = normalizeEmail(payload.getEmail());
        String googleSubject = payload.getSubject();

        // 1. Search by googleSubject first, fallback to email
        Optional<User> userOpt = userRepository.findByGoogleSubject(googleSubject);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmail(normalizedEmail);
        }

        User user;
        if (userOpt.isPresent()) {
            user = userOpt.get();

            if (!user.isActive()) {
                throw new BusinessException("Account is deactivated. Please contact support.", HttpStatus.FORBIDDEN);
            }
            if (user.getAccountStatus() == AccountStatus.REJECTED) {
                throw new BusinessException("Your account has been rejected. Please contact support.", HttpStatus.FORBIDDEN);
            }

            boolean modified = false;
            if (user.getGoogleSubject() == null) {
                user.setGoogleSubject(googleSubject);
                modified = true;
            }
            if (!user.isEmailVerified()) {
                user.setEmailVerified(true);
                modified = true;
            }
            if (modified) {
                user = userRepository.save(user);
            }
        } else {
            String displayName = (payload.getName() != null && !payload.getName().isBlank())
                    ? payload.getName().trim()
                    : deriveNameFromEmail(normalizedEmail);

            String randomPassword = passwordEncoder.encode(UUID.randomUUID().toString());

            user = new User(
                    displayName,
                    normalizedEmail,
                    null,
                    randomPassword,
                    UserRole.CUSTOMER
            );
            user.setGoogleSubject(googleSubject);
            user.setAccountStatus(AccountStatus.APPROVED);
            user.setEmailVerified(true);
            user.setActive(true);

            user = userRepository.save(user);
        }

        String token = jwtService.generateToken(
                user.getEmail(),
                user.getId(),
                user.getRole().name()
        );

        return new AuthResponse(token, UserSummaryDto.fromEntity(user));
    }

    private String deriveNameFromEmail(String email) {
        if (email == null || !email.contains("@")) return "Locvia User";
        String prefix = email.substring(0, email.indexOf('@'));
        return prefix.substring(0, 1).toUpperCase() + prefix.substring(1);
    }

    private String normalizeEmail(String email) {
        if (email == null) return "";
        return email.trim().toLowerCase();
    }
}
