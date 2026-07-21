package com.scholarlinkgh.entity;

/**
 * Availability status of a scholarship.
 * OPEN        – applications are being accepted
 * CLOSING_SOON – deadline is imminent (≤ 7 days)
 * CLOSED      – past deadline, no longer accepting applications
 * FULL        – manually set by admin when all slots are filled
 */
public enum ScholarshipStatus {
    OPEN,
    CLOSING_SOON,
    CLOSED,
    FULL
}
