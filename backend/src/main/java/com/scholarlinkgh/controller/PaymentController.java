package com.scholarlinkgh.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scholarlinkgh.config.PaystackConfig;
import com.scholarlinkgh.dto.AssistedApplicationFeeRequest;
import com.scholarlinkgh.dto.InitializePaymentResponse;
import com.scholarlinkgh.dto.PaymentStatusResponse;
import com.scholarlinkgh.dto.PaymentTransactionResponse;
import com.scholarlinkgh.entity.User;
import com.scholarlinkgh.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final PaystackConfig paystackConfig;
    private final ObjectMapper objectMapper;

    @PostMapping("/payments/ai-credits/initialize")
    public ResponseEntity<InitializePaymentResponse> initializeAiCreditPurchase(
            @AuthenticationPrincipal User user,
            @RequestBody(required = false) java.util.Map<String, String> request) {
        String callbackUrl = request != null ? request.get("callbackUrl") : null;
        return ResponseEntity.ok(paymentService.initializeAiCreditPurchase(user, callbackUrl));
    }

    @PostMapping("/payments/assisted-application/initialize")
    public ResponseEntity<InitializePaymentResponse> initializeAssistedApplicationFee(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody AssistedApplicationFeeRequest request) {
        return ResponseEntity.ok(paymentService.initializeAssistedApplicationFee(user, request.getListingType(), request.getListingId(), request.getCallbackUrl()));
    }

    @GetMapping("/payments/{reference}/status")
    public ResponseEntity<PaymentStatusResponse> getPaymentStatus(@PathVariable String reference) {
        return ResponseEntity.ok(paymentService.getTransactionStatus(reference));
    }

    @GetMapping("/payments/my-transactions")
    public ResponseEntity<Page<PaymentTransactionResponse>> getMyTransactions(
            @AuthenticationPrincipal User user,
            Pageable pageable) {
        return ResponseEntity.ok(paymentService.getMyTransactions(user, pageable));
    }

    @PostMapping("/payments/webhook")
    public ResponseEntity<String> handlePaystackWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "x-paystack-signature", required = false) String signature) {

        if (signature == null || signature.isEmpty()) {
            log.warn("Missing x-paystack-signature header in webhook request");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Missing signature");
        }

        try {
            // Verify HMAC-SHA512 signature
            Mac mac = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKeySpec = new SecretKeySpec(paystackConfig.getWebhookSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            mac.init(secretKeySpec);
            byte[] hmacData = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));

            StringBuilder hexString = new StringBuilder();
            for (byte b : hmacData) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            String computedSignature = hexString.toString();

            if (!computedSignature.equals(signature)) {
                log.warn("Invalid Paystack webhook signature. Computed: {}, Received: {}", computedSignature, signature);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid signature");
            }

            JsonNode eventNode = objectMapper.readTree(payload);
            String event = eventNode.path("event").asText();

            if ("charge.success".equals(event)) {
                String reference = eventNode.path("data").path("reference").asText();
                paymentService.handleWebhookChargeSuccess(reference);
            }

            return ResponseEntity.ok("Webhook processed");

        } catch (Exception e) {
            log.error("Error processing Paystack webhook", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal error");
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/payments")
    public ResponseEntity<Page<PaymentTransactionResponse>> getAdminPayments(
            Pageable pageable,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(paymentService.getAdminPayments(pageable, search));
    }
}
