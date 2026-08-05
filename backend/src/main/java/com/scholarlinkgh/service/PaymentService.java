package com.scholarlinkgh.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scholarlinkgh.config.PaystackConfig;
import com.scholarlinkgh.dto.InitializePaymentResponse;
import com.scholarlinkgh.dto.PaymentStatusResponse;
import com.scholarlinkgh.dto.PaymentTransactionResponse;
import com.scholarlinkgh.entity.*;
import com.scholarlinkgh.repository.JobListingRepository;
import com.scholarlinkgh.repository.PaymentTransactionRepository;
import com.scholarlinkgh.repository.ScholarshipRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final PaystackService paystackService;
    private final AiCreditService aiCreditService;
    private final JobListingRepository jobListingRepository;
    private final ScholarshipRepository scholarshipRepository;
    private final ObjectMapper objectMapper;

    // Default deep link for mobile app payment callback
    private static final String DEFAULT_CALLBACK_URL = "scholarlink-gh://payment-callback";

    @Transactional
    public InitializePaymentResponse initializeAiCreditPurchase(User user, String callbackUrl) {
        String reference = "AICREDIT-" + UUID.randomUUID().toString();
        long amountPesewas = PaystackConfig.BUNDLE_PRICE_PESEWAS;

        PaymentTransaction tx = PaymentTransaction.builder()
                .user(user)
                .type(PaymentType.AI_CREDIT_BUNDLE)
                .amountPesewas(amountPesewas)
                .paystackReference(reference)
                .status(PaymentStatus.PENDING)
                .creditsGranted(PaystackConfig.BUNDLE_CREDITS)
                .build();
        paymentTransactionRepository.save(tx);

        String authorizationUrl = paystackService.initializeTransaction(
                user.getEmail(),
                amountPesewas,
                reference,
                callbackUrl != null && !callbackUrl.isBlank() ? callbackUrl : DEFAULT_CALLBACK_URL
        );

        return new InitializePaymentResponse(authorizationUrl, reference);
    }

    @Transactional
    public InitializePaymentResponse initializeAssistedApplicationFee(User user, String listingType, Long listingId, String callbackUrl) {
        long amountPesewas = 0;
        RelatedEntityType entityType;

        if ("JOB".equalsIgnoreCase(listingType)) {
            entityType = RelatedEntityType.JOB;
            JobListing job = jobListingRepository.findById(listingId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job listing not found"));
            
            if (job.isSponsored()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This listing is sponsored and free to apply.");
            }
            if (job.getAssistedApplicationFee() == null || job.getAssistedApplicationFee() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No fee required for this application.");
            }
            amountPesewas = (long) (job.getAssistedApplicationFee() * 100);
        } else if ("SCHOLARSHIP".equalsIgnoreCase(listingType)) {
            entityType = RelatedEntityType.SCHOLARSHIP;
            Scholarship scholarship = scholarshipRepository.findById(listingId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Scholarship not found"));
            
            if (scholarship.isSponsored()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This listing is sponsored and free to apply.");
            }
            if (scholarship.getAssistedApplicationFee() == null || scholarship.getAssistedApplicationFee() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No fee required for this application.");
            }
            amountPesewas = (long) (scholarship.getAssistedApplicationFee() * 100);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid listing type");
        }

        String reference = "FEE-" + entityType.name() + "-" + UUID.randomUUID().toString();

        PaymentTransaction tx = PaymentTransaction.builder()
                .user(user)
                .type(PaymentType.ASSISTED_APPLICATION_FEE)
                .amountPesewas(amountPesewas)
                .paystackReference(reference)
                .status(PaymentStatus.PENDING)
                .relatedEntityType(entityType)
                .relatedEntityId(listingId)
                .build();
        paymentTransactionRepository.save(tx);

        String authorizationUrl = paystackService.initializeTransaction(
                user.getEmail(),
                amountPesewas,
                reference,
                callbackUrl != null && !callbackUrl.isBlank() ? callbackUrl : DEFAULT_CALLBACK_URL
        );

        return new InitializePaymentResponse(authorizationUrl, reference);
    }

    @Transactional
    public void handleWebhookChargeSuccess(String paystackReference) {
        PaymentTransaction tx = paymentTransactionRepository.findByPaystackReference(paystackReference)
                .orElse(null);

        if (tx == null) {
            log.warn("Webhook received for unknown transaction reference: {}", paystackReference);
            return;
        }

        if (tx.getStatus() == PaymentStatus.SUCCESS) {
            log.info("Transaction {} already marked as SUCCESS. Ignoring webhook.", paystackReference);
            return;
        }

        tx.setStatus(PaymentStatus.SUCCESS);
        paymentTransactionRepository.save(tx);

        if (tx.getType() == PaymentType.AI_CREDIT_BUNDLE) {
            aiCreditService.grantCredits(tx.getUser(), tx.getCreditsGranted());
            log.info("Granted {} AI credits to user {} for transaction {}", 
                    tx.getCreditsGranted(), tx.getUser().getEmail(), paystackReference);
        }
    }

    @Transactional
    public PaymentStatusResponse getTransactionStatus(String reference) {
        PaymentTransaction tx = paymentTransactionRepository.findByPaystackReference(reference)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found"));

        if (tx.getStatus() == PaymentStatus.PENDING) {
            String paystackStatus = paystackService.verifyTransaction(reference);
            if ("success".equalsIgnoreCase(paystackStatus)) {
                // Manually trigger success flow since webhook might be delayed
                handleWebhookChargeSuccess(reference);
                tx = paymentTransactionRepository.findById(tx.getId()).orElse(tx); // Refresh
            } else if ("failed".equalsIgnoreCase(paystackStatus) || "abandoned".equalsIgnoreCase(paystackStatus)) {
                tx.setStatus(PaymentStatus.FAILED);
                paymentTransactionRepository.save(tx);
            }
        }

        return PaymentStatusResponse.builder()
                .reference(tx.getPaystackReference())
                .status(tx.getStatus().name())
                .type(tx.getType().name())
                .amountPesewas(tx.getAmountPesewas())
                .creditsGranted(tx.getCreditsGranted())
                .build();
    }

    @Transactional(readOnly = true)
    public Page<PaymentTransactionResponse> getAdminPayments(Pageable pageable, String search) {
        Page<PaymentTransaction> page;
        if (search != null && !search.isBlank()) {
            page = paymentTransactionRepository.findByUser_EmailContainingIgnoreCaseOrderByCreatedAtDesc(search.trim(), pageable);
        } else {
            page = paymentTransactionRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        return page.map(tx -> PaymentTransactionResponse.builder()
                .id(tx.getId())
                .userEmail(tx.getUser() != null ? tx.getUser().getEmail() : tx.getAnonymizedUserEmail())
                .type(tx.getType().name())
                .amountPesewas(tx.getAmountPesewas())
                .paystackReference(tx.getPaystackReference())
                .status(tx.getStatus().name())
                .relatedEntityType(tx.getRelatedEntityType() != null ? tx.getRelatedEntityType().name() : null)
                .relatedEntityId(tx.getRelatedEntityId())
                .creditsGranted(tx.getCreditsGranted())
                .createdAt(tx.getCreatedAt())
                .updatedAt(tx.getUpdatedAt())
                .build());
    }

    @Transactional(readOnly = true)
    public Page<PaymentTransactionResponse> getMyTransactions(User user, Pageable pageable) {
        Page<PaymentTransaction> page = paymentTransactionRepository.findByUserOrderByCreatedAtDesc(user, pageable);
        
        return page.map(tx -> PaymentTransactionResponse.builder()
                .id(tx.getId())
                .userEmail(tx.getUser() != null ? tx.getUser().getEmail() : tx.getAnonymizedUserEmail())
                .type(tx.getType().name())
                .amountPesewas(tx.getAmountPesewas())
                .paystackReference(tx.getPaystackReference())
                .status(tx.getStatus().name())
                .relatedEntityType(tx.getRelatedEntityType() != null ? tx.getRelatedEntityType().name() : null)
                .relatedEntityId(tx.getRelatedEntityId())
                .creditsGranted(tx.getCreditsGranted())
                .createdAt(tx.getCreatedAt())
                .updatedAt(tx.getUpdatedAt())
                .build());
    }
}
