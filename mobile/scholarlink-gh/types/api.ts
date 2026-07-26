import { applicationStatuses } from '../constants/options';

export type EducationLevel = 'SHS_GRADUATE' | 'UNIVERSITY_GRADUATE';

export type ApiResponse = {
  success: boolean;
  message: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  email: string;
  username: string;
  role: string;
  profilePictureUrl?: string | null;
};

export type Page<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  last: boolean;
};

export type StudentProfile = {
  id?: number;
  educationLevel?: EducationLevel;
  gpa?: number;
  fieldOfStudy?: string;
  institution?: string;
  graduationYear?: number;
  countryPreference?: string;
  languageProficiency?: string;
  standardizedTests?: string;
  financialNeed?: string;
  intendedStartDate?: string;
  bio?: string;
  achievements?: string;
  profileStrengthScore?: number | null;
  profileImprovementSuggestions?: string | null;
  documentDisclaimerAcceptedAt?: string | null;
  skills?: string[];
  profilePictureUrl?: string | null;
};

export type ProfilePayload = {
  education_level?: EducationLevel;
  gpa?: number;
  field_of_study?: string;
  institution?: string;
  graduation_year?: number;
  country_preference?: string;
  language_proficiency?: string;
  standardized_tests?: string;
  financial_need?: string;
  intended_start_date?: string;
  bio?: string;
  achievements?: string;
  skills?: string[];
};

export type Scholarship = {
  id: number;
  name: string;
  provider: string;
  category: string;
  destinationCountry: string;
  eligibleFields: string;
  gpaRequirement: number;
  fundingCoverage: string;
  deadline: string;
  daysUntilDeadline: number;
  officialLink: string;
  requirements: string;
  selectionCriteria: string;
  additionalNotes?: string;
  imageUrl?: string | null;
  status?: 'OPEN' | 'CLOSING_SOON' | 'CLOSED' | 'FULL' | null;
  verified: boolean;
  allowsAssistedApplication?: boolean;
  assistedApplicationFee?: number;
  reportCount?: number;
  createdAt: string;
};

export type ScholarshipMatch = {
  matchId: number;
  scholarshipId: number;
  scholarshipName: string;
  provider: string;
  destinationCountry: string;
  deadline: string;
  fundingCoverage: string;
  officialLink: string;
  matchScore: number;
  matchExplanation: string;
  matchedAt: string;
};

export type Criterion = {
  id: string;
  label: string;
  met: boolean;
  reason: string;
};

export type EligibilityResult = {
  overallMeets?: boolean;
  criteria?: Criterion[];
  [key: string]: unknown;
};

export type ApplicationStatus = (typeof applicationStatuses)[number];
export type ApplicationMode = 'DIRECT' | 'ASSISTED';

export type ApplicationTracker = {
  id: number;
  scholarshipId: number;
  scholarshipName: string;
  scholarshipProvider: string;
  scholarshipDeadline: string;
  imageUrl?: string | null;
  destinationCountry?: string;
  eligibleFields?: string;
  deadlineCountdown: number;
  status: ApplicationStatus;
  applicationMode?: ApplicationMode;
  notes?: string;
  deadlineRemindersSent?: string;
  submittedAt?: string;
  awardedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type DocumentUpload = {
  id: number;
  filename: string;
  document_type: string;
  verification_status: 'PENDING' | 'VERIFIED' | 'SUSPICIOUS' | 'REJECTED';
  verification_notes: string;
  uploaded_at: string;
};

export type DisclaimerStatus = {
  disclaimer_accepted: boolean;
  accepted_at: string | null;
  message: string;
};

export type JobListing = {
  id: number;
  title: string;
  company: string;
  description: string;
  location: string;
  fieldOfStudy: string;
  requiredEducationLevel: string;
  minimumGpa?: number;
  requirements: string[];
  salaryRange?: string;
  applicationUrl?: string;
  imageUrl?: string | null;
  applicationDeadline: string;
  employmentType?: 'FULL_TIME' | 'PART_TIME' | 'INTERNSHIP' | 'CONTRACT' | 'TEMPORARY';
  experienceLevel?: 'ENTRY_LEVEL' | 'GRADUATE' | 'MID_LEVEL' | 'SENIOR';
  workMode?: 'REMOTE' | 'HYBRID' | 'ON_SITE';
  createdAt: string;
};

export type JobApplication = {
  id: number;
  student: StudentProfile; // Or just the ID if populated differently, usually we might just get the job object
  job: JobListing;
  status: ApplicationStatus;
  coverLetter?: string;
  applicationMode: ApplicationMode;
  documents: DocumentUpload[];
  notes?: string;
  appliedAt: string;
  updatedAt: string;
};

export type UnifiedApplication = {
  type: 'job' | 'scholarship';
  id: number;
  title: string;
  provider: string;
  status: ApplicationStatus;
  deadline?: string;
  updatedAt: string;
  linkId: number;
  imageUrl?: string | null;
  destinationCountry?: string;
  eligibleFields?: string;
  deadlineCountdown?: number;
  originalData: ApplicationTracker | JobApplication;
};

export type Notification = {
  id: number;
  type: string;
  title: string;
  body: string;
  relatedScholarshipId?: number | null;
  read: boolean;
  createdAt: string;
};
