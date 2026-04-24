package com.pfe.backend.auth.dto;

import com.pfe.backend.user.Role;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RegisterResponse {
    private Long userId;
    private String name;
    private String email;
    private Role role;
}