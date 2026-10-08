import type { Account, Gender, PatientProfile } from "@/types/models";

export type PublicAccount = Omit<Account, "Password">;

export type AuthSession = {
  Account: PublicAccount;
  PatientProfile: PatientProfile;
};

export type LoginRequest = Pick<Account, "Phone" | "Password">;

export type RegisterPatientRequest = {
  Name: string;
  Gender: Gender;
  Birthdate: string;
  Email: string;
  Phone: string;
  Password: string;
  ConfirmPassword: string;
};

export type AuthField =
  | "Phone"
  | "Password"
  | "Name"
  | "Gender"
  | "Birthdate"
  | "Email"
  | "ConfirmPassword";

export type AuthErrorResponse = {
  Message?: string;
  Errors?: Partial<Record<AuthField, string | string[]>>;
  message?: string;
  errors?: Partial<Record<AuthField, string | string[]>>;
};
