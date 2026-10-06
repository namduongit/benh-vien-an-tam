export type Guid = string;

export const ROLE_UUIDS = {
  SYSTEM_ADMIN: "10000000-0000-4000-8000-000000000001",
  HOSPITAL_ADMIN: "10000000-0000-4000-8000-000000000002",
  DOCTOR: "10000000-0000-4000-8000-000000000003",
  STAFF: "10000000-0000-4000-8000-000000000004",
  WAREHOUSE_MANAGER: "10000000-0000-4000-8000-000000000005",
  PATIENT: "10000000-0000-4000-8000-000000000006",
} as const;

export enum BaseStatus {
  Active = "Active",
  InActive = "InActive",
}

export enum Gender {
  Other = "Other",
  Male = "Male",
  Female = "Female",
}

export type Account = {
  Uuid: Guid;
  Phone: string;
  Password: string;
  RoleUuid: Guid;
  Status: BaseStatus;
  HospitalUuid: Guid | null;
  CreatedAt: Date;
  UpdatedAt: Date;
  DeletedAt: Date;
};

export type PatientProfile = {
  Uuid: Guid;
  Avatar: string;
  Name: string;
  Gender: Gender;
  Birthdate: Date;
  MedicalCode: string;
  Email: string;
  AccountUuid: Guid;
};

export type Hospital = {
  Uuid: Guid;
  Image: string;
  LImage: string;
  MapUrl: string;
  Slug: string;
  Name: string;
  Address: string;
  NumberOfRoom: number;
  Description: string;
  DetailService: string;
  WorkingHour: string;
  Status: BaseStatus;
  CreatedAt: Date;
  UpdatedAt: Date;
  DeletedAt: Date;
};

export enum RoomStatus {
  Available = "Available",
  Occupied = "Occupied",
  Maintenance = "Maintenance",
}

export type Room = {
  Uuid: Guid;
  Name: string;
  Status: RoomStatus;
  HospitalUuid: Guid;
  CreatedAt: Date;
  UpdatedAt: Date;
  DeletedAt: Date;
};

export type DoctorProfile = {
  Uuid: Guid;
  Avatar: string;
  Slug: string;
  Name: string;
  Price: number;
  DepartmentDisplay: string;
  Introduction: string;
  Expertise: string;
  Specialty: string;
  Workplace: string;
  IsFeatured: boolean;
  AccountUuid: Guid;
  HospitalUuid: Guid;
};

export type DoctorDepartment = {
  Uuid: Guid;
  DoctorUuid: Guid;
  DepartmentUuid: Guid;
};

export type Department = {
  Uuid: Guid;
  Icon: string;
  Slug: string;
  Name: string;
  Description: string;
  Status: BaseStatus;
  CreatedAt: Date;
  UpdatedAt: Date;
  DeletedAt: Date;
};

export type HospitalDepartment = {
  Uuid: Guid;
  HospitalUuid: Guid;
  DepartmentUuid: Guid;
};

export type MedicalService = {
  Uuid: Guid;
  Image: string;
  Slug: string;
  Name: string;
  Price: number;
  Description: string;
  DetailService: string;
  WorkingHour: string;
  Status: BaseStatus;
  IsInsured: boolean;
  InsuranceCap: number;
  IsFeatured: boolean;
  CreatedAt: Date;
  UpdatedAt: Date;
  DeletedAt: Date;
};

export type HospitalMedicalService = {
  Uuid: Guid;
  HospitalUuid: Guid;
  MedicalServiceUuid: Guid;
};

export type ReviewHospital = {
  Uuid: Guid;
  Content: string;
  NumberOfStar: number;
  PatientUuid: Guid;
  HospitalUuid: Guid;
  Status: BaseStatus;
  IsViewed: boolean;
  CreatedAt: Date;
};

export type ReviewDoctor = {
  Uuid: Guid;
  Content: string;
  NumberOfStar: number;
  PatientUuid: Guid;
  DoctorUuid: Guid;
  Status: BaseStatus;
  IsViewed: boolean;
  CreatedAt: Date;
};

export type ReviewMedicalService = {
  Uuid: Guid;
  Content: string;
  NumberOfStar: number;
  PatientUuid: Guid;
  MedicalServiceUuid: Guid;
  Status: BaseStatus;
  IsViewed: boolean;
  CreatedAt: Date;
};

export enum MedicineUnit {
  Other = "Other",
  Tablet = "Tablet",
  Bottle = "Bottle",
  Box = "Box",
  Tube = "Tube",
  Sachet = "Sachet",
}

export type Medicine = {
  Uuid: Guid;
  Image: string;
  Name: string;
  Description: string;
  Price: number;
  Unit: MedicineUnit;
  Status: BaseStatus;
  IsInsured: boolean;
  InsuranceCap: number;
  CreatedAt: Date;
  UpdatedAt: Date;
  DeletedAt: Date;
};

export type MedicineInventory = {
  Uuid: Guid;
  HospitalUuid: Guid;
  MedicineUuid: Guid;
  Quantity: number;
  MinimumQuantity: number;
  CreatedAt: Date;
  UpdatedAt: Date;
  DeletedAt: Date;
};

export enum ProviderStatus {
  Active = "Active",
  InActive = "InActive",
}

export type Provider = {
  Uuid: Guid;
  Name: string;
  Address: string;
  Hotline: string;
  Status: ProviderStatus;
  CreatedAt: Date;
  UpdatedAt: Date;
  DeletedAt: Date;
};

export enum ImportTicketStatus {
  Pending = "Pending",
  Confirmed = "Confirmed",
  Cancelled = "Cancelled",
}

export type ImportTicket = {
  Uuid: Guid;
  HospitalUuid: Guid;
  AccountUuid: Guid;
  ProviderUuid: Guid;
  Note: string;
  Status: ImportTicketStatus;
  CreatedAt: Date;
  UpdatedAt: Date;
  DeletedAt: Date;
};

export type ImportTicketDetail = {
  Uuid: Guid;
  ImportTicketUuid: Guid;
  MedicineUuid: Guid;
  Quantity: number;
  Price: number;
};

export enum ExportTicketStatus {
  Pending = "Pending",
  Confirmed = "Confirmed",
  Cancelled = "Cancelled",
}

export type ExportTicket = {
  Uuid: Guid;
  HospitalUuid: Guid;
  AccountUuid: Guid;
  Note: string;
  Status: ExportTicketStatus;
  CreatedAt: Date;
  UpdatedAt: Date;
  DeletedAt: Date;
};

export type ExportTicketDetail = {
  Uuid: Guid;
  ExportTicketUuid: Guid;
  MedicineUuid: Guid;
  Quantity: number;
  Price: number;
};

export enum PrescriptionStatus {
  Unpaid = "Unpaid",
  Paid = "Paid",
  Cancelled = "Cancelled",
}

export type Prescription = {
  Uuid: Guid;
  PatientProfileUuid: Guid;
  DoctorProfileUuid: Guid;
  HospitalUuid: Guid;
  Status: PrescriptionStatus;
  Note: string;
  AppointmentUuid: Guid | null;
  CreatedAt: Date;
  UpdatedAt: Date;
  DeletedAt: Date;
};

export type PrescriptionDetail = {
  Uuid: Guid;
  PrescriptionUuid: Guid;
  MedicineUuid: Guid;
  Quantity: number;
  QuantityPerDose: number;
  DosesPerDay: number;
  Duration: number;
  Price: number;
  IsExternal: boolean;
  Note: string;
};

export enum AppointmentStatus {
  Pending = "Pending",
  Approved = "Approved",
  Done = "Done",
  Cancelled = "Cancelled",
}

export enum AppointmentType {
  Doctor = "Doctor",
  Hospital = "Hospital",
  Service = "Service",
}

type AppointmentBase = {
  Uuid: Guid;
  PatientName: string;
  Gender: Gender;
  MedicalCode: string;
  Note: string;
  StartTime: Date;
  AppointmentDate: Date;
  TimeSlot: Guid;
  Status: AppointmentStatus;
  PatientUuid: Guid | null;
  HospitalUuid: Guid;
  RoomUuid: Guid | null;
  DoctorNote: string;
  TotalPrice: number;
  IsPaid: boolean;
  IsWalkIn: boolean;
  GuestPhone: string | null;
  CreatedAt: Date;
  UpdatedAt: Date;
  DeletedAt: Date;
};

export type Appointment =
  | (AppointmentBase & {
      Type: AppointmentType.Hospital;
      DoctorUuid: null;
      MedicalServiceUuid: null;
    })
  | (AppointmentBase & {
      Type: AppointmentType.Doctor;
      DoctorUuid: Guid;
      MedicalServiceUuid: null;
    })
  | (AppointmentBase & {
      Type: AppointmentType.Service;
      DoctorUuid: null;
      MedicalServiceUuid: Guid;
    });

export type AppointmentMedicalService = {
  Uuid: Guid;
  AppointmentUuid: Guid;
  MedicalServiceUuid: Guid;
  Price: number;
};

export enum PermissionAction {
  Read = "Read",
  Create = "Create",
  Update = "Update",
  Delete = "Delete",
}

export type TimeWorking = {
  Uuid: Guid;
  DayOfWeek: number;
  StartTime: string;
  EndTime: string;
  Status: BaseStatus;
  CreatedAt: Date;
  UpdatedAt: Date;
  DeletedAt: Date;
};

export type DoctorWorking = { Uuid: Guid; DoctorUuid: Guid; WorkingUuid: Guid };
export type HospitalWorking = { Uuid: Guid; HospitalUuid: Guid; WorkingUuid: Guid };
export type ServiceWorking = { Uuid: Guid; ServiceUuid: Guid; WorkingUuid: Guid };

export type Role = {
  Uuid: Guid;
  Name: string;
  Description: string;
  IsDoctor: boolean;
  Status: BaseStatus;
  CreatedAt: Date;
  UpdatedAt: Date;
  DeletedAt: Date;
};

export type Permission = {
  Uuid: Guid;
  Icon: string;
  Name: string;
  Description: string;
};

export type RolePermission = {
  Uuid: Guid;
  RoleUuid: Guid;
  PermissionUuid: Guid;
  Action: PermissionAction;
};
