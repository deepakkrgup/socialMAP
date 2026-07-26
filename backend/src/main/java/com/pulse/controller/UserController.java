package com.pulse.controller;

import com.pulse.dto.ProfileUpdateRequest;
import com.pulse.dto.UserDto;
import com.pulse.model.User;
import com.pulse.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserDto> getMe(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(userService.convertToDto(currentUser, currentUser));
    }

    @PutMapping("/me")
    public ResponseEntity<UserDto> updateProfile(
            @AuthenticationPrincipal User currentUser,
            @RequestBody ProfileUpdateRequest request
    ) {
        return ResponseEntity.ok(userService.updateProfile(currentUser, request));
    }

    @GetMapping("/{username}")
    public ResponseEntity<UserDto> getProfile(
            @PathVariable String username,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(userService.getProfile(username, currentUser));
    }

    @PostMapping("/{username}/follow")
    public ResponseEntity<?> followUser(
            @PathVariable String username,
            @AuthenticationPrincipal User currentUser
    ) {
        userService.followUser(currentUser, username);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{username}/follow")
    public ResponseEntity<?> unfollowUser(
            @PathVariable String username,
            @AuthenticationPrincipal User currentUser
    ) {
        userService.unfollowUser(currentUser, username);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{username}/followers")
    public ResponseEntity<List<UserDto>> getFollowers(
            @PathVariable String username,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(userService.getFollowers(username, currentUser));
    }

    @GetMapping("/{username}/following")
    public ResponseEntity<List<UserDto>> getFollowing(
            @PathVariable String username,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(userService.getFollowing(username, currentUser));
    }

    @GetMapping("/suggestions")
    public ResponseEntity<List<UserDto>> getSuggestions(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(userService.getSuggestions(currentUser));
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserDto>> searchUsers(
            @RequestParam("q") String query,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(userService.searchUsers(query, currentUser));
    }
}
