ALTER TABLE job_listings 
ADD COLUMN IF NOT EXISTS allows_assisted_application BOOLEAN DEFAULT false, 
ADD COLUMN IF NOT EXISTS assisted_application_fee DOUBLE PRECISION, 
ADD COLUMN IF NOT EXISTS sponsored BOOLEAN DEFAULT false;

ALTER TABLE scholarships 
ADD COLUMN IF NOT EXISTS sponsored BOOLEAN DEFAULT false;

ALTER TABLE student_profiles 
ADD COLUMN IF NOT EXISTS ai_credits_remaining INTEGER DEFAULT 5, 
ADD COLUMN IF NOT EXISTS ai_credits_used_total INTEGER DEFAULT 0;
