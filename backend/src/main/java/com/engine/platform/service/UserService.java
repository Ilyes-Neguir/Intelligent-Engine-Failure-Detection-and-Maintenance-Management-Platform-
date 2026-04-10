package com.engine.platform.service;

import com.engine.platform.dto.AuthResponse;
import com.engine.platform.dto.LoginRequest;
import com.engine.platform.dto.RegisterRequest;
import com.engine.platform.exception.AppExceptions;
import com.engine.platform.model.Role;
import com.engine.platform.model.User;
import com.engine.platform.repository.UserRepository;
import com.engine.platform.security.JwtUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppExceptions.ConflictException("Email already registered: " + request.getEmail());
        }

        Role role;
        try {
            role = Role.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new AppExceptions.BadRequestException("Invalid role: " + request.getRole() + ". Must be CLIENT or MECHANIC");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getId(), user.getEmail(), user.getRole().name());
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException("User not found"));

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getId(), user.getEmail(), user.getRole().name());
    }

    public User findById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException("User not found with id: " + userId));
    }
}
