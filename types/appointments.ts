import type {
  AppointmentStatus,
  DoctorProfile,
  Gender,
  Hospital,
  HospitalMedicalService,
  MedicalService,
} from "@/types/models";
import type { PaginatedData } from "@/lib/http/response";

export type BookingType = "hospital" | "doctor" | "medical-service";

export type BookingContext = {
  Hospitals: Hospital[];
  Doctors: DoctorProfile[];
  MedicalServices: MedicalService[];
  HospitalMedicalServices: HospitalMedicalService[];
};

export type AvailabilitySlot = {
  AppointmentAt: string;
  Time: string;
  IsAvailable: boolean;
};

export type Availability = {
  Date: string;
  WorkingHour: string;
  Slots: AvailabilitySlot[];
};

export type CommonAppointmentRequest = {
  PatientName: string;
  Gender: string;
  Note: string;
  MedicalCode: string;
  AppointmentAt: string;
  AccountUuid: string;
  HospitalUuid: string;
};

export type HospitalBookingRequest = CommonAppointmentRequest & {
  Type: "hospital";
};

export type DoctorBookingRequest = CommonAppointmentRequest & {
  Type: "doctor";
  DoctorUuid: string;
};

export type MedicalServiceBookingRequest = CommonAppointmentRequest & {
  Type: "medical-service";
  MedicalServiceUuid: string;
};

export type CreateAppointmentRequest =
  | HospitalBookingRequest
  | DoctorBookingRequest
  | MedicalServiceBookingRequest;

export type WalkInAppointmentRequest = {
  Type: BookingType;
  HospitalUuid: string;
  TargetUuid: string;
  PatientName: string;
  Gender: string;
  Phone: string;
  Birthdate: string;
  MedicalCode: string;
  Note: string;
  AppointmentAt: string;
};

export type WalkInHospitalBookingRequest = Omit<
  WalkInAppointmentRequest,
  "Type" | "TargetUuid"
>;

export type WalkInDoctorBookingRequest = WalkInAppointmentRequest & {
  Type: "doctor";
  DoctorUuid: string;
};

export type WalkInMedicalServiceBookingRequest = WalkInAppointmentRequest & {
  Type: "medical-service";
  MedicalServiceUuid: string;
};

export type CreateWalkInAppointmentRequest =
  | (WalkInAppointmentRequest & { Type: "hospital" })
  | WalkInDoctorBookingRequest
  | WalkInMedicalServiceBookingRequest;

type AppointmentViewBase = {
  Uuid: string;
  PatientName: string;
  Gender: Gender;
  Note: string;
  MedicalCode: string;
  AppointmentAt: Date;
  Status: AppointmentStatus;
  AccountUuid: string;
  HospitalUuid: string;
  RoomUuid: string;
  IsWalkIn: boolean;
  GuestPhone: string | null;
  CreatedAt: Date;
  UpdatedAt: Date;
};

export type Appointment =
  | AppointmentViewBase
  | (AppointmentViewBase & { DoctorUuid: string })
  | (AppointmentViewBase & { MedicalServiceUuid: string });

export type AppointmentConfirmation = {
  Type: BookingType;
  Appointment: Appointment;
  TargetName: string;
  HospitalName: string;
};

export type AppointmentPresentation = AppointmentConfirmation & {
  HospitalSlug: string;
  TargetSlug: string;
  RoomName: string;
};

export type AppointmentListQuery = {
  accountUuid: string;
  status?: AppointmentStatus;
  type?: BookingType;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export type AppointmentList = PaginatedData<AppointmentPresentation>;

export type RescheduleAppointmentRequest = {
  AccountUuid: string;
  AppointmentAt: string;
};

export type CancelAppointmentRequest = {
  AccountUuid: string;
};

export type AppointmentErrorResponse = {
  Message?: string;
  Code?: string;
};
