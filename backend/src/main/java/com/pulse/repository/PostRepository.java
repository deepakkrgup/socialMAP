package com.pulse.repository;

import com.pulse.model.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    
    Page<Post> findByUserUsernameOrderByCreatedAtDesc(String username, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.user.id = :userId OR p.user.id IN (SELECT f.following.id FROM Follow f WHERE f.follower.id = :userId) ORDER BY p.createdAt DESC")
    Page<Post> findFeedPosts(@Param("userId") Long userId, Pageable pageable);

    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
