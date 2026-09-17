package com.locvia.dto;

import com.locvia.entity.AccountStatus;
import com.locvia.entity.User;
import com.locvia.entity.UserRole;

/**
 * Safe representation of a user account sent to the client.
 * Never includes passwords or security credentials.
 * Includes accountStatus so the frontend can show pending-approval banners.
 */
public class UserSummaryDto {

    private Long id;
    private String name;
    private String email;
    private String phone;
    private UserRole role;
    private AccountStatus accountStatus;

    public UserSummaryDto() {
    }

    public UserSummaryDto(Long id, String name, String email, String phone,
                          UserRole role, AccountStatus accountStatus) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.role = role;
        this.accountStatus = accountStatus;
    }

    public static UserSummaryDto fromEntity(User user) {
        if (user == null) return null;
        return new UserSummaryDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getAccountStatus() != null ? user.getAccountStatus() : AccountStatus.APPROVED
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

    public AccountStatus getAccountStatus() {
        return accountStatus;
    }

    public void setAccountStatus(AccountStatus accountStatus) {
        this.accountStatus = accountStatus;
    }
}
