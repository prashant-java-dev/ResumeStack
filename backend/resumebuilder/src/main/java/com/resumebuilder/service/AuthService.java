package com.resumebuilder.service;

import com.resumebuilder.config.JwtUtil;
import com.resumebuilder.dto.LoginRequest;
import com.resumebuilder.dto.RegisterRequest;
import com.resumebuilder.model.User;
import com.resumebuilder.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // Register User
    public User register(RegisterRequest request) {

        Optional<User> existingUser = userRepository.findByEmail(request.getEmail());
        if (existingUser.isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRoles(java.util.List.of("ROLE_USER"));
        user.setProvider("local");

        return userRepository.save(user);
    }

    // Process OAuth Login
    public String processOAuthLogin(String email, String name, String provider, String providerId) {
        Optional<User> existingUser = userRepository.findByEmail(email);
        User user;
        if (existingUser.isPresent()) {
            user = existingUser.get();
            // Update provider if not set (first time oauth for existing email)
            if (user.getProvider() == null || user.getProvider().equals("local")) {
                user.setProvider(provider);
                user.setProviderId(providerId);
                userRepository.save(user);
            }
        } else {
            // New user via OAuth
            user = new User();
            user.setEmail(email);
            user.setName(name);
            user.setRoles(java.util.List.of("ROLE_USER"));
            user.setProvider(provider);
            user.setProviderId(providerId);
            user.setPassword(""); // No password for OAuth users
            userRepository.save(user);
        }
        return jwtUtil.generateToken(user.getEmail());
    }

    // Login User
    public String login(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        return jwtUtil.generateToken(user.getEmail());
    }

    // Get current user from token
    public User getCurrentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
