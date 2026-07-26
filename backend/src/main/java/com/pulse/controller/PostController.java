package com.pulse.controller;

import com.pulse.dto.PostDto;
import com.pulse.model.Post;
import com.pulse.model.User;
import com.pulse.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping
    public ResponseEntity<PostDto> createPost(
            @RequestBody Post post,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(postService.createPost(post, currentUser));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostDto> getPostById(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(postService.getPostById(id, currentUser));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PostDto> updatePost(
            @PathVariable Long id,
            @RequestBody Post postUpdate,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(postService.updatePost(id, postUpdate, currentUser));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        postService.deletePost(id, currentUser);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<Page<PostDto>> getFeed(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "type", defaultValue = "feed") String type,
            @AuthenticationPrincipal User currentUser
    ) {
        Pageable pageable = PageRequest.of(page, size);
        if ("global".equalsIgnoreCase(type)) {
            return ResponseEntity.ok(postService.getGlobalPosts(currentUser, pageable));
        }
        return ResponseEntity.ok(postService.getFeed(currentUser, pageable));
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<Page<PostDto>> getUserPosts(
            @PathVariable String username,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @AuthenticationPrincipal User currentUser
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(postService.getUserPosts(username, currentUser, pageable));
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<?> toggleLike(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        boolean liked = postService.toggleLike(id, currentUser);
        return ResponseEntity.ok().body(Map.of("liked", liked));
    }
    
    // Quick helper for Map in single file response
    private static class Map {
        public static java.util.Map<String, Object> of(String key, Object val) {
            java.util.Map<String, Object> m = new java.util.HashMap<>();
            m.put(key, val);
            return m;
        }
    }
}
