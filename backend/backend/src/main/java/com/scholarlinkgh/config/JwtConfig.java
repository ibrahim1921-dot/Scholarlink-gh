package com.scholarlinkgh.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Getter
@Configuration
public class JwtConfig {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.access-token-expiry-ms:1800000}")
    private long accessTokenExpiryMs;

    @Value("${jwt.refresh-token-expiry-ms:604800000}")
    private long refreshTokenExpiryMs;
}