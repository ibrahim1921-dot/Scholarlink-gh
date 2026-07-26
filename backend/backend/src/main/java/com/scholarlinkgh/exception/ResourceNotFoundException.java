package com.scholarlinkgh.exception;

/**
 * Thrown when a requested resource (job, scholarship, etc.) is not found.
 * The GlobalExceptionHandler maps this to a 404 response.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resource, Long id) {
        super(resource + " not found with id: " + id);
    }
}