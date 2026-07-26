package com.pulse.service;

import com.pulse.dto.CommentDto;
import com.pulse.exception.ResourceNotFoundException;
import com.pulse.model.*;
import com.pulse.repository.CommentRepository;
import com.pulse.repository.LikeRepository;
import com.pulse.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final LikeRepository likeRepository;
    private final UserService userService;
    private final NotificationService notificationService;

    @Transactional
    public CommentDto addComment(Long postId, String content, Long parentCommentId, User user) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        Comment comment = Comment.builder()
                .post(post)
                .user(user)
                .content(content)
                .build();

        if (parentCommentId != null) {
            Comment parent = commentRepository.findById(parentCommentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Parent comment not found"));
            comment.setParentComment(parent);
        }

        Comment saved = commentRepository.save(comment);

        // Notify post owner or parent comment owner
        if (parentCommentId != null) {
            notificationService.createAndSendNotification(
                    comment.getParentComment().getUser(),
                    user,
                    NotificationType.COMMENT,
                    postId
            );
        } else {
            notificationService.createAndSendNotification(
                    post.getUser(),
                    user,
                    NotificationType.COMMENT,
                    postId
            );
        }

        return convertToDto(saved, user);
    }

    @Transactional(readOnly = true)
    public List<CommentDto> getCommentsForPost(Long postId, User currentUser) {
        // Fetch only root comments. Replies are loaded dynamically and mapped hierarchically.
        return commentRepository.findByPostIdAndParentCommentIsNullOrderByCreatedAtAsc(postId)
                .stream()
                .map(comment -> convertToDto(comment, currentUser))
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteComment(Long commentId, User user) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        if (!comment.getUser().getId().equals(user.getId()) && !comment.getPost().getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Unauthorized deletion");
        }

        commentRepository.delete(comment);
    }

    @Transactional
    public boolean toggleLike(Long commentId, User user) {
        commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        Optional<Like> existingLike = likeRepository.findByUserIdAndTargetTypeAndTargetId(
                user.getId(), TargetType.COMMENT, commentId
        );

        if (existingLike.isPresent()) {
            likeRepository.delete(existingLike.get());
            return false;
        } else {
            Like like = Like.builder()
                    .user(user)
                    .targetType(TargetType.COMMENT)
                    .targetId(commentId)
                    .build();
            likeRepository.save(like);
            return true;
        }
    }

    public CommentDto convertToDto(Comment comment, User currentUser) {
        long likesCount = likeRepository.countByTargetTypeAndTargetId(TargetType.COMMENT, comment.getId());
        boolean isLiked = likeRepository.existsByUserIdAndTargetTypeAndTargetId(
                currentUser.getId(), TargetType.COMMENT, comment.getId()
        );

        // Map child replies recursively
        List<CommentDto> repliesDto = comment.getReplies().stream()
                .map(reply -> convertToDto(reply, currentUser))
                .collect(Collectors.toList());

        return CommentDto.builder()
                .id(comment.getId())
                .postId(comment.getPost().getId())
                .user(userService.convertToDto(comment.getUser(), currentUser))
                .content(comment.getContent())
                .parentCommentId(comment.getParentComment() != null ? comment.getParentComment().getId() : null)
                .likesCount(likesCount)
                .isLiked(isLiked)
                .replies(repliesDto)
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
