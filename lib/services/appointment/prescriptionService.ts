import { httpClient } from "@/lib/http/client";
import type { ApiResponse } from "@/lib/http/response";
import type { Prescription } from "@/types/internal-clinical";

export const prescriptionService = {
    async getPrescription(appointmentUuid: string, signal?: AbortSignal): Promise<Prescription | null> {
        try {
            const res = await httpClient.get<ApiResponse<Prescription>>(`/internal/clinical/appointments/${appointmentUuid}/prescription`, { signal });
            return res.data.Data;
        } catch {
            return null;
        }
    },

    async savePrescription(appointmentUuid: string, note: string, items: Array<{
        MedicineUuid: string;
        Quantity: number;
        QuantityPerDose: number;
        DosesPerDay: number;
        Duration: number;
        Note: string;
    }>): Promise<Prescription> {
        const res = await httpClient.post<ApiResponse<Prescription>>(`/internal/clinical/appointments/${appointmentUuid}/prescription`, {
            Note: note,
            Items: items,
        });
        return res.data.Data;
    }
};