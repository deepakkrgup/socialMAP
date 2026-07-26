package com.pulse.controller;

import com.pulse.dto.CommentDto;
import com.pulse.model.User;
import com.pulse.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<CommentDto> addComment(
            @PathVariable Long postId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User currentUser
    ) {
        String content = (String) body.get("content");
        Number parentIdNum = (Number) body.get("parentCommentId");
        Long parentCommentId = parentIdNum != null ? parentIdNum.longValue() : null;

        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("Comment content cannot be empty");
        }

        return ResponseEntity.ok(commentService.addComment(postId, content, parentCommentId, currentUser));
    }

    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<List<CommentDto>> getComments(
            @PathVariable Long postId,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(commentService.getCommentsForPost(postId, currentUser));
    }

    @PostMapping("/comments/{commentId}/like")
    public ResponseEntity<?> toggleLike(
            @PathVariable Long commentId,
            @AuthenticationPrincipal User currentUser
    ) {
        boolean liked = commentService.toggleLike(commentId, currentUser);
        return ResponseEntity.ok(Map.of("liked", liked));
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<?> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal User currentUser
    ) {
        commentService.deleteComment(commentId, currentUser);
        return ResponseEntity.ok().build();
    }
}
