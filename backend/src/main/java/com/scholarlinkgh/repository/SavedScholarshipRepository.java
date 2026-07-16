package com.scholarlinkgh.repository;

import com.scholarlinkgh.entity.SavedScholarship;
import com.scholarlinkgh.entity.Scholarship;
import com.scholarlinkgh.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedScholarshipRepository extends JpaRepository<SavedScholarship, Long> {

    boolean existsByStudentAndScholarship(User student, Scholarship scholarship);

    Optional<SavedScholarship> findByStudentAndScholarship(User student, Scholarship scholarship);

    List<SavedScholarship> findAllByStudentOrderBySavedAtDesc(User student);

    @Modifying
    void deleteByStudentAndScholarship(User student, Scholarship scholarship);
}
