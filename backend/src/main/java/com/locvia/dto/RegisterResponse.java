package com.locvia.dto;

/**
 * Response payload returned after public user registration.
 * Indicates that an email verification code has been dispatched.
 * Does NOT contain a JWT token or OTP.
 */
public class RegisterResponse {

    private String message;
    private boolean emailVerificationRequired;
    private String email;
    private UserSummaryDto user;

    public RegisterResponse() {
        this.emailVerificationRequired = true;
    }

    public RegisterResponse(String message, boolean emailVerificationRequired, String email, UserSummaryDto user) {
        this.message = message;
        this.emailVerificationRequired = emailVerificationRequired;
        this.email = email;
        this.user = user;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isEmailVerificationRequired() {
        return emailVerificationRequired;
    }

    public void setEmailVerificationRequired(boolean emailVerificationRequired) {
        this.emailVerificationRequired = emailVerificationRequired;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public UserSummaryDto getUser() {
        return user;
    }

    public void setUser(UserSummaryDto user) {
        this.user = user;
    }
}