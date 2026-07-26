package com.scholarlinkgh.dto;

import com.scholarlinkgh.entity.ApplicationMode;
import com.scholarlinkgh.entity.ApplicationStatus;
import com.scholarlinkgh.entity.JobApplication;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
public class JobApplicationResponse {
    private Long id;
    private UserResponse student;
    private JobListingResponse job;
    private ApplicationStatus status;
    private String coverLetter;
    private ApplicationMode applicationMode;
    private LocalDateTime appliedAt;
    private LocalDateTime updatedAt;

    public static JobApplicationResponse from(JobApplication app) {
        return JobApplicationResponse.builder()
            .id(app.getId())
            .student(UserResponse.from(app.getStudent()))
            .job(JobListingResponse.from(app.getJob()))
            .status(app.getStatus())
            .coverLetter(app.getCoverLetter())
            .applicationMode(app.getApplicationMode())
            .appliedAt(app.getAppliedAt())
            .updatedAt(app.getUpdatedAt())
            .build();
    }
}
