package com.scholarlinkgh.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PaystackConfig {

    public static final int BUNDLE_CREDITS = 10;
    public static final long BUNDLE_PRICE_PESEWAS = 2000L; // ₵20.00

    @Value("${paystack.secret-key}")
    private String secretKey;

    @Value("${paystack.public-key}")
    private String publicKey;

    @Value("${paystack.webhook-secret}")
    private String webhookSecret;

    public String getSecretKey() {
        return secretKey;
    }

    public String getPublicKey() {
        return publicKey;
    }

    public String getWebhookSecret() {
        return webhookSecret;
    }
}
