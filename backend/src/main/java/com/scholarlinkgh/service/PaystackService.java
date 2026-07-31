package com.scholarlinkgh.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scholarlinkgh.config.PaystackConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaystackService {

    private final PaystackConfig paystackConfig;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper;

    /**
     * Initializes a transaction with Paystack.
     *
     * @param email         Customer's email
     * @param amountPesewas Amount in pesewas (smallest currency unit for GHS)
     * @param reference     Unique transaction reference
     * @param callbackUrl   URL to redirect to after payment
     * @return Authorization URL returned by Paystack
     */
    public String initializeTransaction(String email, long amountPesewas, String reference, String callbackUrl) {
        String url = "https://api.paystack.co/transaction/initialize";

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + paystackConfig.getSecretKey());
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("email", email);
        requestBody.put("amount", amountPesewas);
        requestBody.put("reference", reference);
        requestBody.put("callback_url", callbackUrl);
        requestBody.put("currency", "GHS");

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, requestEntity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                if (root.path("status").asBoolean()) {
                    return root.path("data").path("authorization_url").asText();
                } else {
                    throw new RuntimeException("Paystack API returned false status: " + root.path("message").asText());
                }
            } else {
                throw new RuntimeException("Failed to initialize transaction. Status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Error initializing Paystack transaction: {}", e.getMessage(), e);
            throw new RuntimeException("Could not initialize payment. Please try again later.", e);
        }
    }

    /**
     * Verifies a transaction with Paystack (fallback if webhook fails).
     *
     * @param reference The unique transaction reference
     * @return The status returned by Paystack ("success", "failed", "abandoned", etc.)
     */
    public String verifyTransaction(String reference) {
        String url = "https://api.paystack.co/transaction/verify/" + reference;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + paystackConfig.getSecretKey());

        HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, requestEntity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                if (root.path("status").asBoolean()) {
                    return root.path("data").path("status").asText();
                }
            }
        } catch (Exception e) {
            log.error("Error verifying Paystack transaction {}: {}", reference, e.getMessage(), e);
        }
        return "pending"; // Default to pending if we can't verify
    }
}
