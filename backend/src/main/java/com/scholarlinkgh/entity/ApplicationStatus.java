package com.scholarlinkgh.entity;

/**
 * ApplicationStatus enum — represents the lifecycle stages of a scholarship application.
 *
 * FR-22: students progress through these states as they work on their applications.
 */
public enum ApplicationStatus {
    /** Student is still researching the scholarship. */
    RESEARCHING,

    /** Student has started filling out the application. */
    IN_PROGRESS,

    /** Application has been formally submitted. */
    SUBMITTED,

    /** Student has been invited to an interview. */
    INTERVIEW,

    /** Student was awarded the scholarship. */
    AWARDED,

    /** Application was rejected or unsuccessful. */
    REJECTED
}
