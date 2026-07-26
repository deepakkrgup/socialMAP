package com.pulse.repository;

import com.pulse.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m WHERE (m.sender.id = :u1 AND m.receiver.id = :u2) OR (m.sender.id = :u2 AND m.receiver.id = :u1) ORDER BY m.createdAt ASC")
    List<Message> findChatHistory(@Param("u1") Long userId1, @Param("u2") Long userId2);

    @Query("SELECT m FROM Message m WHERE m.id IN (SELECT MAX(m2.id) FROM Message m2 WHERE m2.sender.id = :userId OR m2.receiver.id = :userId GROUP BY CASE WHEN m2.sender.id = :userId THEN m2.receiver.id ELSE m2.sender.id END) ORDER BY m.createdAt DESC")
    List<Message> findConversations(@Param("userId") Long userId);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.sender.id = :contactId AND m.receiver.id = :userId AND m.isRead = false")
    long countUnreadMessages(@Param("contactId") Long contactId, @Param("userId") Long userId);
}
