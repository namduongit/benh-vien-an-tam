export type ClinicalAppointmentStatus =
  | "Approved"
  | "CheckedIn"
  | "Done"
  | "Pending";

export type ClinicalAppointment = {
  Uuid: string;
  PatientName: string;
  Gender: "Female" | "Male" | "Other";
  MedicalCode: string;
  Note: string;
  AppointmentAt: Date;
  TypeLabel: string;
  RoomName: string;
  Status: ClinicalAppointmentStatus;
  DoctorNote: string;
};

export type ClinicalMedicalServiceStatus = "Completed" | "InProgress";

export type ClinicalMedicalService = {
  Uuid: string;
  AppointmentUuid: string;
  MedicalServiceUuid: string;
  Name: string;
  Price: number;
  Description: string;
  Status: ClinicalMedicalServiceStatus;
};

export type ClinicalServiceOption = {
  Uuid: string;
  Name: string;
  Price: number;
};

export type ClinicalMedicineOption = {
  Uuid: string;
  Name: string;
  Unit: string;
};

export type ClinicalCaseDetail = ClinicalAppointment & {
  MedicalServices: ClinicalMedicalService[];
  AvailableMedicalServices: ClinicalServiceOption[];
  AvailableMedicines: ClinicalMedicineOption[];
};
