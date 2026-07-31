package com.scholarlinkgh.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentTransactionResponse {
    private Long id;
    private String userEmail;
    private String type;
    private Long amountPesewas;
    private String paystackReference;
    private String status;
    private String relatedEntityType;
    private Long relatedEntityId;
    private Integer creditsGranted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
