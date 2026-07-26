package com.pulse.service;

import com.pulse.config.JwtService;
import com.pulse.dto.*;
import com.pulse.exception.ResourceNotFoundException;
import com.pulse.model.*;
import com.pulse.repository.FollowRepository;
import com.pulse.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final NotificationService notificationService;

    @Transactional
    public AuthResponse register(UserRegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getDisplayName() != null ? request.getDisplayName() : request.getUsername())
                .profilePictureUrl("https://api.dicebear.com/7.x/bottts/svg?seed=" + request.getUsername())
                .coverPhotoUrl("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80")
                .bio("")
                .build();

        User savedUser = userRepository.save(user);
        
        String accessToken = jwtService.generateToken(savedUser);
        String refreshToken = jwtService.generateRefreshToken(savedUser);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(convertToDto(savedUser, savedUser))
                .build();
    }

    public AuthResponse login(UserLoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String accessToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(convertToDto(user, user))
                .build();
    }

    public AuthResponse refreshToken(String refreshToken) {
        String username = jwtService.extractUsername(refreshToken);
        if (username != null) {
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            
            if (jwtService.isTokenValid(refreshToken, user)) {
                String accessToken = jwtService.generateToken(user);
                return AuthResponse.builder()
                        .accessToken(accessToken)
                        .refreshToken(refreshToken)
                        .user(convertToDto(user, user))
                        .build();
            }
        }
        throw new IllegalArgumentException("Invalid refresh token");
    }

    @Transactional
    public UserDto updateProfile(User user, ProfileUpdateRequest request) {
        User existingUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.getDisplayName() != null && !request.getDisplayName().trim().isEmpty()) {
            existingUser.setDisplayName(request.getDisplayName());
        }
        if (request.getBio() != null) {
            existingUser.setBio(request.getBio());
        }
        if (request.getProfilePictureUrl() != null) {
            existingUser.setProfilePictureUrl(request.getProfilePictureUrl());
        }
        if (request.getCoverPhotoUrl() != null) {
            existingUser.setCoverPhotoUrl(request.getCoverPhotoUrl());
        }

        User saved = userRepository.save(existingUser);
        return convertToDto(saved, saved);
    }

    @Transactional(readOnly = true)
    public UserDto getProfile(String username, User currentUser) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return convertToDto(user, currentUser);
    }

    @Transactional
    public void followUser(User currentUser, String username) {
        User target = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        
        if (currentUser.getId().equals(target.getId())) {
            throw new IllegalArgumentException("You cannot follow yourself");
        }

        Optional<Follow> existing = followRepository.findByFollowerIdAndFollowingId(currentUser.getId(), target.getId());
        if (existing.isEmpty()) {
            Follow follow = Follow.builder()
                    .follower(currentUser)
                    .following(target)
                    .build();
            followRepository.save(follow);

            // Send notification
            notificationService.createAndSendNotification(target, currentUser, NotificationType.FOLLOW, currentUser.getId());
        }
    }

    @Transactional
    public void unfollowUser(User currentUser, String username) {
        User target = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        followRepository.findByFollowerIdAndFollowingId(currentUser.getId(), target.getId())
                .ifPresent(followRepository::delete);
    }

    @Transactional(readOnly = true)
    public List<UserDto> searchUsers(String query, User currentUser) {
        return userRepository.searchUsers(query).stream()
                .map(user -> convertToDto(user, currentUser))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserDto> getSuggestions(User currentUser) {
        return userRepository.findFollowSuggestions(currentUser.getId(), PageRequest.of(0, 5))
                .stream()
                .map(user -> convertToDto(user, currentUser))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserDto> getFollowers(String username, User currentUser) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        
        return followRepository.findByFollowingUsername(user.getUsername()).stream()
                .map(Follow::getFollower)
                .map(f -> convertToDto(f, currentUser))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserDto> getFollowing(String username, User currentUser) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        
        return followRepository.findByFollowerUsername(user.getUsername()).stream()
                .map(Follow::getFollowing)
                .map(f -> convertToDto(f, currentUser))
                .collect(Collectors.toList());
    }

    public UserDto convertToDto(User user, User currentUser) {
        long followersCount = followRepository.countByFollowingId(user.getId());
        long followingCount = followRepository.countByFollowerId(user.getId());
        boolean isFollowing = followRepository.existsByFollowerIdAndFollowingId(currentUser.getId(), user.getId());

        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .bio(user.getBio())
                .profilePictureUrl(user.getProfilePictureUrl())
                .coverPhotoUrl(user.getCoverPhotoUrl())
                .followersCount(followersCount)
                .followingCount(followingCount)
                .isFollowing(isFollowing)
                .createdAt(user.getCreatedAt())
                .build();
    }
}
