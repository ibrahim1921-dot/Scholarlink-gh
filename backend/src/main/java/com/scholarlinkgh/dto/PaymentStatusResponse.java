package com.scholarlinkgh.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentStatusResponse {
    private String reference;
    private String status;
    private String type;
    private Long amountPesewas;
    private Integer creditsGranted;
}
