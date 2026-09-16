package com.locvia.dto;

import com.locvia.entity.User;
import com.locvia.entity.UserRole;

import java.time.LocalDateTime;

/**
 * Standard user response exposed across User and Admin APIs.
 * Contains safe user fields; never exposes passwords or internal credentials.
 */
public record UserResponse(
        Long id,
        String name,
        String email,
        String phone,
        UserRole role,
        Boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static UserResponse fromEntity(User user) {
        if (user == null) {
            return null;
        }
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getActive() != null ? user.getActive() : true,
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
