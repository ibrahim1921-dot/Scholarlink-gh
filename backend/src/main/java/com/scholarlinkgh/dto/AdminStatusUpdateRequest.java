package com.scholarlinkgh.dto;

import com.scholarlinkgh.entity.ApplicationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminStatusUpdateRequest {
    @NotNull(message = "Status is required")
    private ApplicationStatus status;
}
