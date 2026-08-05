package com.scholarlinkgh.dto;

import com.scholarlinkgh.entity.AdminNote;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AdminNoteResponse {
    private Long id;
    private String adminEmail;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AdminNoteResponse from(AdminNote note) {
        return AdminNoteResponse.builder()
            .id(note.getId())
            .adminEmail(note.getAdmin().getEmail())
            .note(note.getNote())
            .createdAt(note.getCreatedAt())
            .updatedAt(note.getUpdatedAt())
            .build();
    }
}
