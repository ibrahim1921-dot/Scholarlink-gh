package com.scholarlinkgh.service;

import com.scholarlinkgh.entity.StudentProfile;
import com.scholarlinkgh.entity.User;
import com.scholarlinkgh.repository.StudentProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * AiCreditService — manages AI generation credit balance for students.
 *
 * Each student starts with {@link #FREE_ALLOTMENT} free credits (lifetime, not renewing).
 * Credits are decremented after each successful AI generation and can be
 * replenished via admin grant or (future Phase 3) purchase.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiCreditService {

    /**
     * Number of free AI generations every new student receives.
     * Defined as a named constant so it's easy to change in one place.
     */
    public static final int FREE_ALLOTMENT = 5;

    private final StudentProfileRepository studentProfileRepository;

    /**
     * Validates that the student has at least one AI credit remaining.
     * Throws 402 Payment Required if balance is zero.
     *
     * @param user the authenticated student
     * @throws ResponseStatusException with 402 if no credits remain
     */
    public void validateCredits(User user) {
        StudentProfile profile = getOrCreateProfile(user);
        if (profile.getAiCreditsRemaining() == null || profile.getAiCreditsRemaining() <= 0) {
            throw new ResponseStatusException(
                HttpStatus.PAYMENT_REQUIRED,
                "You've used all your free AI generations. Purchase more to continue."
            );
        }
    }

    /**
     * Consumes one AI credit after a successful generation.
     * Decrements remaining and increments used-total atomically.
     *
     * @param user the authenticated student
     */
    @Transactional
    public void consumeCredit(User user) {
        StudentProfile profile = getOrCreateProfile(user);
        int remaining = profile.getAiCreditsRemaining() != null ? profile.getAiCreditsRemaining() : 0;
        int usedTotal = profile.getAiCreditsUsedTotal() != null ? profile.getAiCreditsUsedTotal() : 0;

        profile.setAiCreditsRemaining(Math.max(remaining - 1, 0));
        profile.setAiCreditsUsedTotal(usedTotal + 1);
        studentProfileRepository.save(profile);

        log.info("AI credit consumed for user {}. Remaining: {}, Total used: {}",
            user.getEmail(), profile.getAiCreditsRemaining(), profile.getAiCreditsUsedTotal());
    }

    /**
     * Returns the current credit balance for a student.
     *
     * @param user the authenticated student
     * @return remaining credits
     */
    public int getCredits(User user) {
        StudentProfile profile = getOrCreateProfile(user);
        return profile.getAiCreditsRemaining() != null ? profile.getAiCreditsRemaining() : FREE_ALLOTMENT;
    }

    /**
     * Grants additional credits to a student (admin action).
     *
     * @param user   the target student
     * @param amount number of credits to add (must be positive)
     * @return new credit balance
     */
    @Transactional
    public int grantCredits(User user, int amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }

        StudentProfile profile = getOrCreateProfile(user);
        int current = profile.getAiCreditsRemaining() != null ? profile.getAiCreditsRemaining() : 0;
        profile.setAiCreditsRemaining(current + amount);
        studentProfileRepository.save(profile);

        log.info("Granted {} AI credits to user {}. New balance: {}",
            amount, user.getEmail(), profile.getAiCreditsRemaining());

        return profile.getAiCreditsRemaining();
    }

    /**
     * Retrieves the student's profile, creating one with default credits if none exists.
     */
    private StudentProfile getOrCreateProfile(User user) {
        return studentProfileRepository.findByUser(user)
            .orElseGet(() -> {
                StudentProfile newProfile = StudentProfile.builder()
                    .user(user)
                    .aiCreditsRemaining(FREE_ALLOTMENT)
                    .aiCreditsUsedTotal(0)
                    .build();
                return studentProfileRepository.save(newProfile);
            });
    }
}
