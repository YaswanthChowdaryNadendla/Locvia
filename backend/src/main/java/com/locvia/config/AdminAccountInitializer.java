package com.locvia.config;

import com.locvia.entity.AccountStatus;
import com.locvia.entity.User;
import com.locvia.entity.UserRole;
import com.locvia.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Production-safe default admin account initializer.
 * Idempotently provisions the default administrator account on application startup
 * if an account with email admin@locvia.com is not already registered.
 */
@Component
public class AdminAccountInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminAccountInitializer.class);

    public static final String DEFAULT_ADMIN_NAME = "Locvia Admin";
    public static final String DEFAULT_ADMIN_EMAIL = "admin@locvia.com";
    private static final String DEFAULT_ADMIN_PASSWORD = "Admin@123";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminAccountInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        try {
            if (userRepository.existsByEmail(DEFAULT_ADMIN_EMAIL)) {
                log.info("Default admin account already exists with email: {}", DEFAULT_ADMIN_EMAIL);
                return;
            }

            User admin = new User();
            admin.setName(DEFAULT_ADMIN_NAME);
            admin.setEmail(DEFAULT_ADMIN_EMAIL);
            admin.setPassword(passwordEncoder.encode(DEFAULT_ADMIN_PASSWORD));
            admin.setRole(UserRole.ADMIN);
            admin.setActive(true);
            admin.setAccountStatus(AccountStatus.APPROVED);

            userRepository.save(admin);
            log.info("Successfully provisioned default admin account with email: {}", DEFAULT_ADMIN_EMAIL);
        } catch (Exception ex) {
            log.error("Failed to initialize default admin account: {}", ex.getMessage(), ex);
        }
    }
}
