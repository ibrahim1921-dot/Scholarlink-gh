export const educationLevels = [
  { label: 'SHS Graduate', value: 'SHS_GRADUATE' },
  { label: 'University Graduate', value: 'UNIVERSITY_GRADUATE' },
] as const;

export const scholarshipCategories = [
  { label: 'Undergrad Ghana', value: 'UNDERGRADUATE_GHANA' },
  { label: 'Undergrad International', value: 'UNDERGRADUATE_INTERNATIONAL' },
  { label: 'Postgrad Ghana', value: 'POSTGRADUATE_GHANA' },
  { label: 'Postgrad International', value: 'POSTGRADUATE_INTERNATIONAL' },
] as const;

export const applicationStatuses = [
  'RESEARCHING',
  'IN_PROGRESS',
  'SUBMITTED',
  'INTERVIEW',
  'AWARDED',
  'REJECTED',
] as const;

export const documentTypes = [
  'TRANSCRIPT',
  'CV',
  'STATEMENT',
  'REFERENCE',
  'IDENTITY',
  'FINANCIAL_PROOF',
  'OTHER',
] as const;
