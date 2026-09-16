package com.locvia.dto;

import com.locvia.entity.User;
import com.locvia.entity.UserRole;

/**
 * Safe representation of a user account sent to the client.
 * Never includes passwords or security credentials.
 */
public class UserSummaryDto {

    private Long id;
    private String name;
    private String email;
    private String phone;
    private UserRole role;

    public UserSummaryDto() {
    }

    public UserSummaryDto(Long id, String name, String email, String phone, UserRole role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.role = role;
    }

    public static UserSummaryDto fromEntity(User user) {
        if (user == null) return null;
        return new UserSummaryDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }
}
