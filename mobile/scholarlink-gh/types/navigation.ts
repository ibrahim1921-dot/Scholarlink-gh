import { Scholarship } from './api';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  VerifyOtp: { email: string };
};

export type MainTabParamList = {
  Home: undefined;
  Scholarships: undefined;
  Applications: undefined;
  Assistant: undefined;
  Career: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ProfileSetup: undefined;
  ScholarshipDetail: { scholarshipId: number; scholarship?: Scholarship };
  Documents: undefined;
};
