package com.scholarlinkgh.controller;

import com.scholarlinkgh.dto.ApplicationTrackerRequest;
import com.scholarlinkgh.dto.ApplicationTrackerResponse;
import com.scholarlinkgh.dto.ApiResponse;
import com.scholarlinkgh.service.ApplicationTrackerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * ApplicationTrackerController — REST endpoints for scholarship application tracking.
 *
 * GET    /api/v1/trackers           — list all trackers for the student (with deadline countdown)
 * POST   /api/v1/trackers           — start tracking a scholarship
 * PUT    /api/v1/trackers/{id}      — update status or notes
 * DELETE /api/v1/trackers/{id}      — remove a tracker
 *
 * FR-22 / FR-26: deadline_countdown included in every response.
 * All endpoints require a valid JWT (STUDENT role).
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/trackers")
@RequiredArgsConstructor
public class ApplicationTrackerController {

    private final ApplicationTrackerService trackerService;

    /**
     * GET /api/v1/trackers
     * Returns all scholarship trackers for the authenticated student,
     * including computed deadline countdown for each.
     */
    @GetMapping
    public ResponseEntity<List<ApplicationTrackerResponse>> getMyTrackers() {
        return ResponseEntity.ok(trackerService.getMyTrackers());
    }

    /**
     * POST /api/v1/trackers
     * Starts tracking a scholarship.
     * Body: { scholarship_id }
     */
    @PostMapping
    public ResponseEntity<ApplicationTrackerResponse> createTracker(
            @Valid @RequestBody ApplicationTrackerRequest request) {
        try {
            ApplicationTrackerResponse response = trackerService.createTracker(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (RuntimeException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * PUT /api/v1/trackers/{id}
     * Updates the status or notes of an existing tracker.
     * Body: { status, notes }
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApplicationTrackerResponse> updateTracker(
            @PathVariable Long id,
            @RequestBody ApplicationTrackerRequest request) {
        try {
            ApplicationTrackerResponse response = trackerService.updateTracker(id, request);
            return ResponseEntity.ok(response);
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (RuntimeException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * DELETE /api/v1/trackers/{id}
     * Removes a tracker. Only the owning student can delete it.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteTracker(@PathVariable Long id) {
        try {
            trackerService.deleteTracker(id);
            return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Tracker removed successfully.")
                .build());
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (RuntimeException ex) {
            return ResponseEntity.notFound().build();
        }
    }
}
