package com.locvia.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Request payload for updating the current user's profile information.
 * Does not allow modifying roles, identifiers, or credentials.
 */
public class UpdateUserRequest {

    @NotBlank(message = "Name cannot be blank")
    private String name;

    private String phone;

    @Email(message = "Invalid email format")
    private String email;

    public UpdateUserRequest() {
    }

    public UpdateUserRequest(String name, String phone, String email) {
        this.name = name != null ? name.trim() : null;
        this.phone = phone != null ? phone.trim() : null;
        this.email = email != null ? email.trim() : null;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name != null ? name.trim() : null;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone != null ? phone.trim() : null;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email != null ? email.trim() : null;
    }
}
