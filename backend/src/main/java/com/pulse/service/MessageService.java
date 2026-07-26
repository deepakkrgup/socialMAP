package com.pulse.service;

import com.pulse.dto.ConversationDto;
import com.pulse.dto.MessageDto;
import com.pulse.dto.UserDto;
import com.pulse.exception.ResourceNotFoundException;
import com.pulse.model.*;
import com.pulse.repository.MessageRepository;
import com.pulse.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public MessageDto sendMessage(User sender, String receiverUsername, String content) {
        User receiver = userRepository.findByUsername(receiverUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Receiver not found"));

        if (sender.getId().equals(receiver.getId())) {
            throw new IllegalArgumentException("You cannot message yourself");
        }

        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .content(content)
                .isRead(false)
                .build();

        Message saved = messageRepository.save(message);
        MessageDto dto = convertToDto(saved);

        // Push live message over WebSockets to recipient's private queue
        try {
            messagingTemplate.convertAndSendToUser(
                    receiver.getUsername(),
                    "/queue/messages",
                    dto
            );
        } catch (Exception e) {
            // Handle websocket exceptions silently
        }

        // Trigger notification
        notificationService.createAndSendNotification(receiver, sender, NotificationType.MESSAGE, saved.getId());

        return dto;
    }

    @Transactional(readOnly = true)
    public List<MessageDto> getChatHistory(User currentUser, String contactUsername) {
        User contact = userRepository.findByUsername(contactUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Contact not found"));

        return messageRepository.findChatHistory(currentUser.getId(), contact.getId()).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ConversationDto> getConversations(User currentUser) {
        List<Message> latestMessages = messageRepository.findConversations(currentUser.getId());
        
        return latestMessages.stream()
                .map(msg -> {
                    User contact = msg.getSender().getId().equals(currentUser.getId()) ? msg.getReceiver() : msg.getSender();
                    long unreadCount = messageRepository.countUnreadMessages(contact.getId(), currentUser.getId());
                    UserDto contactDto = userService.convertToDto(contact, currentUser);
                    
                    return ConversationDto.builder()
                            .contact(contactDto)
                            .lastMessage(convertToDto(msg))
                            .unreadCount(unreadCount)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void markMessagesAsRead(User currentUser, String contactUsername) {
        User contact = userRepository.findByUsername(contactUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Contact not found"));

        List<Message> unread = messageRepository.findChatHistory(currentUser.getId(), contact.getId()).stream()
                .filter(msg -> msg.getReceiver().getId().equals(currentUser.getId()) && !msg.isRead())
                .peek(msg -> msg.setRead(true))
                .collect(Collectors.toList());

        messageRepository.saveAll(unread);
    }

    public MessageDto convertToDto(Message m) {
        return MessageDto.builder()
                .id(m.getId())
                .senderId(m.getSender().getId())
                .senderUsername(m.getSender().getUsername())
                .receiverId(m.getReceiver().getId())
                .receiverUsername(m.getReceiver().getUsername())
                .content(m.getContent())
                .isRead(m.isRead())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
