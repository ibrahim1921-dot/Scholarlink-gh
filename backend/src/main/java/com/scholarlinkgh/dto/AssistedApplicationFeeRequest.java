package com.scholarlinkgh.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssistedApplicationFeeRequest {
    @NotBlank(message = "Listing type is required (JOB or SCHOLARSHIP)")
    private String listingType;

    @NotNull(message = "Listing ID is required")
    private Long listingId;

    private String callbackUrl;
}
