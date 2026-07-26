package com.scholarlinkgh.config;

import com.scholarlinkgh.entity.EmploymentType;
import com.scholarlinkgh.entity.ExperienceLevel;
import com.scholarlinkgh.entity.WorkMode;
import com.scholarlinkgh.entity.JobListing;
import com.scholarlinkgh.repository.JobListingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * One-time backfill migration to fix legacy JobListing rows that have NULL 
 * employmentType, experienceLevel, or workMode.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataBackfill implements CommandLineRunner {

    private final JobListingRepository jobListingRepository;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Checking for legacy job listings with NULL classification fields...");
        
        List<JobListing> allJobs = jobListingRepository.findAll();
        int updatedCount = 0;
        
        for (JobListing job : allJobs) {
            boolean updated = false;
            
            if (job.getEmploymentType() == null) {
                // Infer from title if possible, else default to FULL_TIME
                if (job.getTitle() != null && job.getTitle().toLowerCase().contains("intern")) {
                    job.setEmploymentType(EmploymentType.INTERNSHIP);
                } else if (job.getTitle() != null && job.getTitle().toLowerCase().contains("contract")) {
                    job.setEmploymentType(EmploymentType.CONTRACT);
                } else {
                    job.setEmploymentType(EmploymentType.FULL_TIME);
                }
                updated = true;
            }
            
            if (job.getExperienceLevel() == null) {
                if (job.getTitle() != null && job.getTitle().toLowerCase().contains("senior")) {
                    job.setExperienceLevel(ExperienceLevel.SENIOR);
                } else if (job.getTitle() != null && job.getTitle().toLowerCase().contains("intern")) {
                    job.setExperienceLevel(ExperienceLevel.ENTRY_LEVEL);
                } else {
                    job.setExperienceLevel(ExperienceLevel.MID_LEVEL);
                }
                updated = true;
            }
            
            if (job.getWorkMode() == null) {
                // Default to ON_SITE if remote isn't specified in location
                if (job.getLocation() != null && job.getLocation().toLowerCase().contains("remote")) {
                    job.setWorkMode(WorkMode.REMOTE);
                } else {
                    job.setWorkMode(WorkMode.ON_SITE);
                }
                updated = true;
            }
            
            if (updated) {
                jobListingRepository.save(job);
                updatedCount++;
                log.info("Backfilled missing fields for Job ID {}: {}", job.getId(), job.getTitle());
            }
        }
        
        if (updatedCount > 0) {
            log.info("DataBackfill complete. Updated {} legacy job listings.", updatedCount);
        } else {
            log.info("No legacy job listings required backfilling.");
        }
    }
}
