package com.scholarlinkgh.dto;

import com.scholarlinkgh.entity.Role;
import com.scholarlinkgh.entity.User;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private Role role;
    private boolean enabled;
    private String createdAt; // if User doesn't have createdAt, we might skip it or use something else. Let's see if User has createdAt. User extends UserDetails but no auditable fields are visible in User.java. Let's check User.java again. It doesn't have createdAt.

    public static UserResponse from(User user) {
        return UserResponse.builder()
            .id(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .role(user.getRole())
            .enabled(user.isEnabled())
            .build();
    }
}
