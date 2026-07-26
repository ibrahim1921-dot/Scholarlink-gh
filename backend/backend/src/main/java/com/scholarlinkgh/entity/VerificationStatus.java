package com.scholarlinkgh.entity;

/**
 * VerificationStatus enum — result of AI first-level document verification.
 *
 * FR-38: AI checks for letterhead, keyword presence, name/GPA match against profile.
 *        SUSPICIOUS documents are queued for human admin review.
 */
public enum VerificationStatus {
    /** Document is awaiting AI processing. */
    PENDING,

    /** Document passed all AI verification checks. */
    VERIFIED,

    /** Document has anomalies and has been queued for admin review. */
    SUSPICIOUS,

    /** Document failed critical checks (e.g. name does not match profile). */
    REJECTED
}
