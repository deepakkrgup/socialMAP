package com.pulse.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentDto {
    private Long id;
    private Long postId;
    private UserDto user;
    private String content;
    private Long parentCommentId;
    private Long likesCount;
    private Boolean isLiked;
    private List<CommentDto> replies;
    private LocalDateTime createdAt;
}
