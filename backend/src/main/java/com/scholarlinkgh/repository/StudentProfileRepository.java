package com.scholarlinkgh.repository;

import com.scholarlinkgh.entity.StudentProfile;
import com.scholarlinkgh.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for StudentProfile entities.
 * FR-09 / FR-10: profiles are loaded by GeminiAIService for matching.
 */
@Repository
public interface StudentProfileRepository extends JpaRepository<StudentProfile, Long> {

    /** Finds a profile by the associated user account. */
    Optional<StudentProfile> findByUser(User user);

    /** Checks whether a profile already exists for a user. */
    boolean existsByUser(User user);
}
