package com.pulse.controller;

import com.pulse.dto.ConversationDto;
import com.pulse.dto.MessageDto;
import com.pulse.model.User;
import com.pulse.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @PostMapping
    public ResponseEntity<MessageDto> sendMessage(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User currentUser
    ) {
        String receiverUsername = body.get("receiverUsername");
        String content = body.get("content");

        if (receiverUsername == null || content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("Receiver and content are required");
        }

        return ResponseEntity.ok(messageService.sendMessage(currentUser, receiverUsername, content));
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationDto>> getConversations(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(messageService.getConversations(currentUser));
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<List<MessageDto>> getChatHistory(
            @PathVariable String username,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(messageService.getChatHistory(currentUser, username));
    }

    @PostMapping("/read/{username}")
    public ResponseEntity<?> markAsRead(
            @PathVariable String username,
            @AuthenticationPrincipal User currentUser
    ) {
        messageService.markMessagesAsRead(currentUser, username);
        return ResponseEntity.ok().build();
    }
}
