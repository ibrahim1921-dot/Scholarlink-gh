-- 1. Create the new job_requirements table (Hibernate would create this, but we do it first)
CREATE TABLE IF NOT EXISTS job_requirements (
    job_listing_id BIGINT NOT NULL,
    requirements TEXT,
    CONSTRAINT fk_job_requirements_job_id FOREIGN KEY (job_listing_id) REFERENCES job_listings(id)
);

-- 2. Backfill existing data by splitting on newline or comma
-- We replace commas with newlines, then split by newline, trim whitespace, and ignore empties
INSERT INTO job_requirements (job_listing_id, requirements)
SELECT
    id AS job_listing_id,
    trim(unnest(string_to_array(replace(requirements, ',', E'\n'), E'\n'))) AS requirement
FROM job_listings
WHERE requirements IS NOT NULL AND requirements != '';

-- Delete any inadvertently empty rows from consecutive commas or newlines
DELETE FROM job_requirements WHERE requirements = '' OR requirements IS NULL;

-- 3. Rename old column as a rollback safety net
ALTER TABLE job_listings RENAME COLUMN requirements TO old_requirements;
