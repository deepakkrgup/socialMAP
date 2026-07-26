package com.pulse.service;

import com.pulse.dto.NotificationDto;
import com.pulse.dto.UserDto;
import com.pulse.model.Notification;
import com.pulse.model.NotificationType;
import com.pulse.model.User;
import com.pulse.repository.NotificationRepository;
import com.pulse.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public NotificationDto createAndSendNotification(User recipient, User actor, NotificationType type, Long entityId) {
        // Don't notify yourself
        if (recipient.getId().equals(actor.getId())) {
            return null;
        }

        Notification notification = Notification.builder()
                .recipient(recipient)
                .actor(actor)
                .type(type)
                .entityId(entityId)
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        NotificationDto dto = convertToDto(saved);

        // Push via WebSocket
        try {
            messagingTemplate.convertAndSendToUser(
                    recipient.getUsername(),
                    "/queue/notifications",
                    dto
            );
        } catch (Exception e) {
            // Handle offline or WS messaging failures silently
        }

        return dto;
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> getNotificationsForUser(User user) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(User user) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(user.getId());
    }

    @Transactional
    public void markAsRead(Long notificationId, User user) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        if (!notification.getRecipient().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Unauthorized");
        }
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(User user) {
        List<Notification> unread = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .filter(n -> !n.isRead())
                .peek(n -> n.setRead(true))
                .collect(Collectors.toList());
        notificationRepository.saveAll(unread);
    }

    public NotificationDto convertToDto(Notification n) {
        return NotificationDto.builder()
                .id(n.getId())
                .actor(UserDto.builder()
                        .id(n.getActor().getId())
                        .username(n.getActor().getUsername())
                        .displayName(n.getActor().getDisplayName())
                        .profilePictureUrl(n.getActor().getProfilePictureUrl())
                        .build())
                .type(n.getType().name())
                .entityId(n.getEntityId())
                .isRead(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
