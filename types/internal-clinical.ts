export type ClinicalAppointmentStatus = "Approved" | "Pending" | "Unconfirmed" | "CheckedIn" | "Done" | "Cancelled";
export type ClinicalMedicalServiceStatus = "Processing" | "Done";
export type PrescriptionStatus = "Unpaid" | "Paid" | "Cancelled";

export interface ClinicalAppointment {
    Uuid: string;
    PatientName: string;
    Gender: "Male" | "Female" | "Other";
    MedicalCode: string;
    Note?: string;
    AppointmentAt: Date;
    TypeLabel: string;
    RoomName: string;
    Status: ClinicalAppointmentStatus;
    DoctorNote?: string;
}

export interface ClinicalMedicalService {
    Uuid: string;
    AppointmentUuid: string;
    MedicalServiceUuid: string;
    Name: string;
    Price: number;
    Description: string;
    Status: ClinicalMedicalServiceStatus;
}

export interface ClinicalServiceOption {
    Uuid: string;
    Name: string;
    Price: number;
}

export interface ClinicalMedicineOption {
    Uuid: string;
    Name: string;
    Unit: string;
}

export interface PrescriptionDetail {
    Uuid: string;
    MedicineUuid: string;
    MedicineName: string;
    Unit: string;
    Quantity: number;
    QuantityPerDose: number;
    DosesPerDay: number;
    Duration: number;
    Note: string;
}

export interface Prescription {
    Uuid: string;
    Status: PrescriptionStatus;
    Note?: string;
    Details: PrescriptionDetail[];
}

export interface ClinicalCaseDetail extends ClinicalAppointment {
    MedicalServices: ClinicalMedicalService[];
    AvailableMedicalServices: ClinicalServiceOption[];
    AvailableMedicines: ClinicalMedicineOption[];
    Prescription?: Prescription | null;
}