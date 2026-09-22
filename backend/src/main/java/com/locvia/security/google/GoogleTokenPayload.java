package com.locvia.security.google;

/**
 * Value object representing verified identity claims extracted from a valid Google ID token.
 */
public class GoogleTokenPayload {

    private final String subject;
    private final String email;
    private final String name;
    private final String picture;
    private final boolean emailVerified;

    public GoogleTokenPayload(String subject, String email, String name, String picture, boolean emailVerified) {
        this.subject = subject;
        this.email = email;
        this.name = name;
        this.picture = picture;
        this.emailVerified = emailVerified;
    }

    public String getSubject() {
        return subject;
    }

    public String getEmail() {
        return email;
    }

    public String getName() {
        return name;
    }

    public String getPicture() {
        return picture;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }
}
