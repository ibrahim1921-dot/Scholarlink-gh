package com.scholarlinkgh.dto;

import com.scholarlinkgh.entity.Notification;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponse {
    private Long id;
    private String type;
    private String title;
    private String body;
    private Long relatedScholarshipId;
    private boolean read;
    private LocalDateTime createdAt;

    public static NotificationResponse fromEntity(Notification notification) {
        return NotificationResponse.builder()
            .id(notification.getId())
            .type(notification.getType())
            .title(notification.getTitle())
            .body(notification.getBody())
            .relatedScholarshipId(notification.getRelatedScholarshipId())
            .read(notification.isRead())
            .createdAt(notification.getCreatedAt())
            .build();
    }
}
