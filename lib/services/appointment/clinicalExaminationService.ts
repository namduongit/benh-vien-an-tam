import { httpClient } from "@/lib/http/client";
import type { ApiResponse } from "@/lib/http/response";
import type { ClinicalMedicalService, ClinicalMedicalServiceStatus, ClinicalMedicineOption } from "@/types/internal-clinical";

export const clinicalExaminationService = {
    async addService(appointmentUuid: string, medicalServiceUuid: string): Promise<ClinicalMedicalService> {
        const res = await httpClient.post<ApiResponse<ClinicalMedicalService>>(`/internal/clinical/appointments/${appointmentUuid}/medical-services`, {
            MedicalServiceUuid: medicalServiceUuid,
        });
        return res.data.Data;
    },

    async updateService(appointmentUuid: string, serviceUuid: string, description: string, status: ClinicalMedicalServiceStatus): Promise<ClinicalMedicalService> {
        const res = await httpClient.put<ApiResponse<ClinicalMedicalService>>(`/internal/clinical/appointments/${appointmentUuid}/medical-services/${serviceUuid}`, {
            Description: description,
            Status: status,
        });
        return res.data.Data;
    },

    async saveDiagnosis(appointmentUuid: string, doctorNote: string): Promise<boolean> {
        const res = await httpClient.post<ApiResponse<bool>>(`/internal/clinical/appointments/${appointmentUuid}/diagnosis`, {
            DoctorNote: doctorNote,
        });
        return res.data.Data;
    },

    async searchMedicines(keyword: string, signal?: AbortSignal): Promise<ClinicalMedicineOption[]> {
        const res = await httpClient.get<ApiResponse<ClinicalMedicineOption[]>>("/internal/clinical/medicines/search", {
            params: { keyword },
            signal,
        });
        return res.data.Data;
    }
};