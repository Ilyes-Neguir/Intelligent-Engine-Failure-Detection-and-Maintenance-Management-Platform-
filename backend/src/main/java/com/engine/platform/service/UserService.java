package com.engine.platform.service;

import com.engine.platform.dto.LoginRequest;
import com.engine.platform.dto.RegisterRequest;
import com.engine.platform.dto.AuthResponse;
import com.engine.platform.entity.User;
import com.engine.platform.exception.AppExceptions;
import com.engine.platform.repository.UserRepository;
import com.engine.platform.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppExceptions.ConflictException("Email already registered: " + request.getEmail());
        }
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setRole(request.getRole());
        userRepository.save(user);
        String token = jwtUtil.generateToken(user);
        return new AuthResponse(token, user.getId(), user.getEmail(), user.getRole().name());
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException("User not found"));
        String token = jwtUtil.generateToken(user);
        return new AuthResponse(token, user.getId(), user.getEmail(), user.getRole().name());
    }

    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException("User not found with id: " + id));
    }
}
