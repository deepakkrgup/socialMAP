package com.pulse.service;

import com.pulse.dto.PostDto;
import com.pulse.exception.ResourceNotFoundException;
import com.pulse.model.*;
import com.pulse.repository.CommentRepository;
import com.pulse.repository.LikeRepository;
import com.pulse.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final LikeRepository likeRepository;
    private final CommentRepository commentRepository;
    private final UserService userService;
    private final NotificationService notificationService;

    @Transactional
    public PostDto createPost(Post post, User user) {
        post.setUser(user);
        Post saved = postRepository.save(post);
        return convertToDto(saved, user);
    }

    @Transactional(readOnly = true)
    public PostDto getPostById(Long id, User currentUser) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with ID: " + id));
        return convertToDto(post, currentUser);
    }

    @Transactional
    public PostDto updatePost(Long id, Post postUpdate, User user) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with ID: " + id));
        
        if (!post.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You can only edit your own posts");
        }

        post.setContentText(postUpdate.getContentText());
        if (postUpdate.getMediaUrl() != null) {
            post.setMediaUrl(postUpdate.getMediaUrl());
        }

        Post saved = postRepository.save(post);
        return convertToDto(saved, user);
    }

    @Transactional
    public void deletePost(Long id, User user) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with ID: " + id));

        if (!post.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You can only delete your own posts");
        }

        postRepository.delete(post);
    }

    @Transactional(readOnly = true)
    public Page<PostDto> getFeed(User user, Pageable pageable) {
        return postRepository.findFeedPosts(user.getId(), pageable)
                .map(post -> convertToDto(post, user));
    }

    @Transactional(readOnly = true)
    public Page<PostDto> getGlobalPosts(User user, Pageable pageable) {
        return postRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(post -> convertToDto(post, user));
    }

    @Transactional(readOnly = true)
    public Page<PostDto> getUserPosts(String username, User currentUser, Pageable pageable) {
        return postRepository.findByUserUsernameOrderByCreatedAtDesc(username, pageable)
                .map(post -> convertToDto(post, currentUser));
    }

    @Transactional
    public boolean toggleLike(Long postId, User user) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with ID: " + postId));

        Optional<Like> existingLike = likeRepository.findByUserIdAndTargetTypeAndTargetId(
                user.getId(), TargetType.POST, postId
        );

        if (existingLike.isPresent()) {
            likeRepository.delete(existingLike.get());
            return false; // Unliked
        } else {
            Like like = Like.builder()
                    .user(user)
                    .targetType(TargetType.POST)
                    .targetId(postId)
                    .build();
            likeRepository.save(like);

            // Notify post owner
            notificationService.createAndSendNotification(post.getUser(), user, NotificationType.LIKE, postId);
            return true; // Liked
        }
    }

    public PostDto convertToDto(Post post, User currentUser) {
        long likesCount = likeRepository.countByTargetTypeAndTargetId(TargetType.POST, post.getId());
        long commentsCount = post.getId() != null ? commentRepository.findByPostIdAndParentCommentIsNullOrderByCreatedAtAsc(post.getId()).size() : 0; // Quick count, we can do proper count query but this works
        boolean isLiked = likeRepository.existsByUserIdAndTargetTypeAndTargetId(
                currentUser.getId(), TargetType.POST, post.getId()
        );

        return PostDto.builder()
                .id(post.getId())
                .user(userService.convertToDto(post.getUser(), currentUser))
                .contentText(post.getContentText())
                .mediaUrl(post.getMediaUrl())
                .likesCount(likesCount)
                .commentsCount(commentsCount)
                .isLiked(isLiked)
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }
}
