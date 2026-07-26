DELETE FROM job_applications;
DELETE FROM saved_jobs;
DELETE FROM job_requirements;
DELETE FROM job_listings;

INSERT INTO job_listings (id, title, company, description, location, field_of_study, required_education_level, minimum_gpa, salary_range, application_url, image_url, application_deadline, employment_type, experience_level, work_mode, active, created_at, updated_at) VALUES 
(1, 'Software Engineering Intern', 'MTN Ghana', 'Join our mobile app team to build the next generation of fintech apps.', 'Accra, Ghana', 'Computer Science', 'UNDERGRADUATE', 3.0, 'GH¢ 2,000 - 3,000', 'https://mtn.com.gh/careers', 'https://picsum.photos/seed/job1/600/400', '2027-12-01 23:59:59', 'INTERNSHIP', 'ENTRY_LEVEL', 'HYBRID', true, NOW(), NOW()),
(2, 'Junior Data Analyst', 'Tullow Oil', 'Analyze drilling data and create performance dashboards.', 'Takoradi, Ghana', 'Statistics, Engineering', 'UNDERGRADUATE', 3.2, 'GH¢ 4,000 - 6,000', NULL, 'https://picsum.photos/seed/job2/600/400', '2027-11-15 23:59:59', 'FULL_TIME', 'ENTRY_LEVEL', 'ON_SITE', true, NOW(), NOW()),
(3, 'Graduate Management Trainee', 'Standard Chartered Bank', '18-month rotational program for recent graduates with strong leadership potential.', 'Accra, Ghana', 'Business, Finance', 'BACHELORS', 3.5, 'Competitive', 'https://sc.com/careers', 'https://picsum.photos/seed/job3/600/400', '2027-10-30 23:59:59', 'FULL_TIME', 'GRADUATE', 'HYBRID', true, NOW(), NOW()),
(4, 'Frontend Developer (React Native)', 'Hubtel', 'Build and maintain our core merchant applications.', 'Remote', 'Computer Science, IT', 'BACHELORS', NULL, 'GH¢ 8,000 - 12,000', NULL, 'https://picsum.photos/seed/job4/600/400', '2027-09-01 23:59:59', 'FULL_TIME', 'MID_LEVEL', 'REMOTE', true, NOW(), NOW()),
(5, 'Marketing Intern', 'Vodafone Ghana', 'Assist in digital marketing campaigns and social media management.', 'Accra, Ghana', 'Marketing, Communications', 'UNDERGRADUATE', NULL, 'GH¢ 1,500 - 2,000', 'https://vodafone.com.gh/careers', 'https://picsum.photos/seed/job5/600/400', '2027-12-15 23:59:59', 'INTERNSHIP', 'ENTRY_LEVEL', 'HYBRID', true, NOW(), NOW()),
(6, 'Cloud Operations Engineer', 'Paystack', 'Ensure reliability and uptime of payment infrastructure.', 'Remote', 'Computer Science', 'BACHELORS', 3.0, 'Competitive', NULL, 'https://picsum.photos/seed/job6/600/400', '2028-01-10 23:59:59', 'FULL_TIME', 'MID_LEVEL', 'REMOTE', true, NOW(), NOW()),
(7, 'Legal Associate (Graduate)', 'KPMG', 'Provide legal advisory and corporate governance services.', 'Accra, Ghana', 'Law', 'BACHELORS', 3.6, 'GH¢ 5,000 - 7,000', 'https://kpmg.com/gh/careers', 'https://picsum.photos/seed/job7/600/400', '2027-08-20 23:59:59', 'FULL_TIME', 'GRADUATE', 'ON_SITE', true, NOW(), NOW()),
(8, 'Product Designer', 'Mest Africa', 'Design user experiences for agritech startups.', 'Accra, Ghana', 'Design, HCI', 'BACHELORS', NULL, 'GH¢ 6,000 - 9,000', NULL, 'https://picsum.photos/seed/job8/600/400', '2027-11-05 23:59:59', 'CONTRACT', 'MID_LEVEL', 'HYBRID', true, NOW(), NOW()),
(9, 'Cybersecurity Analyst', 'Bank of Ghana', 'Monitor network traffic and manage security incidents.', 'Accra, Ghana', 'Computer Science, IT', 'MASTERS', 3.5, 'Competitive', 'https://bog.gov.gh/careers', 'https://picsum.photos/seed/job9/600/400', '2027-10-01 23:59:59', 'FULL_TIME', 'SENIOR', 'ON_SITE', true, NOW(), NOW()),
(10, 'Customer Success Representative', 'Chipper Cash', 'Support users and resolve transaction issues globally.', 'Remote', 'Any', 'SHS_GRADUATE', NULL, 'GH¢ 3,000 - 4,500', NULL, 'https://picsum.photos/seed/job10/600/400', '2027-09-30 23:59:59', 'FULL_TIME', 'ENTRY_LEVEL', 'REMOTE', true, NOW(), NOW());

INSERT INTO job_requirements (job_listing_id, requirements) VALUES 
(1, 'Currently pursuing a degree in Computer Science'),
(1, 'Familiarity with Java or Kotlin'),
(1, 'Basic understanding of mobile app architecture'),
(1, 'Strong problem-solving skills'),
(2, 'Degree in Statistics or Engineering'),
(2, 'Proficiency in SQL and Excel'),
(2, 'Experience with PowerBI or Tableau is a plus'),
(3, 'Recent graduate with a minimum 3.5 GPA'),
(3, 'Excellent communication and presentation skills'),
(3, 'Demonstrated leadership in extracurricular activities'),
(3, 'Willingness to rotate across different departments'),
(4, '2+ years of experience with React Native'),
(4, 'Strong understanding of Redux and state management'),
(4, 'Experience integrating REST APIs'),
(4, 'Familiarity with native build tools (Xcode, Gradle)'),
(5, 'Strong writing and editing skills'),
(5, 'Knowledge of social media trends in Ghana'),
(5, 'Creative mindset with attention to detail'),
(6, 'Experience with AWS or GCP'),
(6, 'Proficiency in Linux administration'),
(6, 'Knowledge of infrastructure as code (Terraform)'),
(6, 'Experience with CI/CD pipelines'),
(7, 'LLB and completion of Ghana School of Law'),
(7, 'Strong analytical and research skills'),
(7, 'Attention to detail and ability to work under pressure'),
(8, 'Portfolio demonstrating UI/UX design process'),
(8, 'Proficiency in Figma or Sketch'),
(8, 'Experience conducting user research'),
(9, 'Master''s degree in Cybersecurity or related field'),
(9, 'Certifications like CISSP or CEH preferred'),
(9, '5+ years of experience in network security'),
(9, 'Strong knowledge of firewalls and IDS/IPS'),
(10, 'Excellent written and verbal communication'),
(10, 'Ability to empathize with customers'),
(10, 'Previous experience in customer service is a plus');

SELECT setval('job_listings_id_seq', (SELECT MAX(id) FROM job_listings));
