package com.scholarlinkgh.entity;

/**
 * DocumentType enum — classifies the types of documents a student can upload.
 *
 * FR-38: each type has different AI verification rules.
 */
public enum DocumentType {
    /** Academic transcript showing grades and courses. */
    TRANSCRIPT,

    /** Curriculum vitae / résumé. */
    CV,

    /** Personal statement or motivation letter. */
    STATEMENT,

    /** Academic or professional reference letter. */
    REFERENCE,

    /** National ID, passport, or other identity document. */
    IDENTITY,

    /** Proof of financial need (e.g. bank statement, tax return). */
    FINANCIAL_PROOF,

    /** Any other document that doesn't fit the above categories. */
    OTHER
}
