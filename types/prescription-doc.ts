export type PrescriptionStatus = "Unpaid" | "Paid" | "Cancelled";

// 1. DTO Số liệu thống kê Metric Cards
export interface PrescriptionMetrics {
    monthlyCount: number;
    monthlyDiffFromLastMonth: number;
    unpaidCount: number;
    paidCount: number;
    cancelledCount: number;
}

// 2. Query Parameters khi tìm kiếm & lọc đơn thuốc
export interface PrescriptionQuery {
    search?: string;
    date?: string; // Định dạng YYYY-MM-DD
    status?: PrescriptionStatus | string;
    page?: number;
    pageSize?: number;
}

// 3. Item Đơn thuốc hiển thị trong bảng
export interface PrescriptionListItem {
    uuid: string;
    rxCode: string;
    patientName: string;
    patientMedicalCode: string;
    createdAt: string;
    medicineCount: number;
    totalAmount: number;
    status: PrescriptionStatus;
}

// 4. Các Sub-interfaces cho Chi tiết đơn thuốc (Modal)
export interface PatientInfo {
    medicalCode: string;
    insuranceCode?: string | null;
    name: string;
    gender: string;
    birthdate: string;
    email?: string;
}

export interface PrescriptionAppointmentInfo {
    uuid: string;
    code?: string;
    type?: string;
    time?: string;
    roomName?: string;
    doctorNote: string;
}

export interface PrescriptionDetailItem {
    medicineUuid?: string;
    medicineName: string;
    unit: string;
    quantity: number;
    quantityPerDose: number;
    dosesPerDay: number;
    duration: number;
    price: number;
    isExternal: boolean;
    isInsured?: boolean;
    insuranceCap?: number;
    note: string;
}

// 5. Chi tiết đầy đủ của 1 Đơn thuốc
export interface PrescriptionDetail {
    uuid: string;
    rxCode: string;
    createdAt: string;
    status: PrescriptionStatus;
    note: string;
    patient: PatientInfo;
    appointment?: PrescriptionAppointmentInfo;
    details: PrescriptionDetailItem[];
}

// 6. Payload Yêu cầu hủy đơn
export interface CancelPrescriptionPayload {
    reason: string;
}