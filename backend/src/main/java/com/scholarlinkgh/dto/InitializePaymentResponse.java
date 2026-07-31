package com.scholarlinkgh.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InitializePaymentResponse {
    private String authorizationUrl;
    private String reference;
}
