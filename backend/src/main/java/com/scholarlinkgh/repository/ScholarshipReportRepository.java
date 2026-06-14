package com.scholarlinkgh.repository;

import com.scholarlinkgh.entity.Scholarship;
import com.scholarlinkgh.entity.ScholarshipReport;
import com.scholarlinkgh.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ScholarshipReportRepository extends JpaRepository<ScholarshipReport, Long> {

    boolean existsByScholarshipAndReporter(Scholarship scholarship, User reporter);

    long countByScholarship(Scholarship scholarship);
}
