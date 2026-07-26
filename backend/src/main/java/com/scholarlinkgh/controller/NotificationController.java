package com.scholarlinkgh.controller;

import com.scholarlinkgh.dto.ApiResponse;
import com.scholarlinkgh.dto.NotificationResponse;
import com.scholarlinkgh.entity.Notification;
import com.scholarlinkgh.entity.User;
import com.scholarlinkgh.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<Page<NotificationResponse>> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        User user = getCurrentUser();
        Pageable pageable = PageRequest.of(page, size);
        
        Page<NotificationResponse> notifications = notificationRepository
            .findByUserOrderByCreatedAtDesc(user, pageable)
            .map(NotificationResponse::fromEntity);
            
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        User user = getCurrentUser();
        long count = notificationRepository.countByUserAndIsReadFalse(user);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PatchMapping("/{id}/read")
    @Transactional
    public ResponseEntity<ApiResponse> markAsRead(@PathVariable Long id) {
        User user = getCurrentUser();
        
        Notification notification = notificationRepository.findById(id).orElse(null);
        if (notification == null || !notification.getUser().getId().equals(user.getId())) {
            return ResponseEntity.notFound().build();
        }
        
        notification.setRead(true);
        notificationRepository.save(notification);
        
        return ResponseEntity.ok(ApiResponse.builder()
            .success(true)
            .message("Notification marked as read")
            .build());
    }

    @PatchMapping("/read-all")
    @Transactional
    public ResponseEntity<ApiResponse> markAllAsRead() {
        User user = getCurrentUser();
        
        notificationRepository.markAllAsReadByUser(user);
        
        return ResponseEntity.ok(ApiResponse.builder()
            .success(true)
            .message("All notifications marked as read")
            .build());
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<ApiResponse> deleteNotification(@PathVariable Long id) {
        User user = getCurrentUser();
        
        Notification notification = notificationRepository.findById(id).orElse(null);
        if (notification == null || !notification.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(ApiResponse.builder()
                .success(false)
                .message("Notification not found or access denied")
                .build());
        }
        
        notificationRepository.delete(notification);
        
        return ResponseEntity.ok(ApiResponse.builder()
            .success(true)
            .message("Notification deleted")
            .build());
    }

    @DeleteMapping
    @Transactional
    public ResponseEntity<ApiResponse> deleteAllNotifications() {
        User user = getCurrentUser();
        
        notificationRepository.deleteAllByUser(user);
        
        return ResponseEntity.ok(ApiResponse.builder()
            .success(true)
            .message("All notifications deleted")
            .build());
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (User) auth.getPrincipal();
    }
}
