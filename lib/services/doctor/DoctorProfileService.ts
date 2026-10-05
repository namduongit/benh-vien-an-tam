import { isAxiosError } from "axios";
import { httpClient } from "@/lib/http/client";
import type { ApiResponse } from "@/lib/http/response";
import type {
    DoctorProfileResponse,
    UpdateDoctorProfilePayload,
} from "@/types/doctor-profile";

export class DoctorProfileInternalService {
    async getMyProfile(
        signal?: AbortSignal
    ): Promise<ApiResponse<DoctorProfileResponse> | null> {
        try {
            const response = await httpClient.get<ApiResponse<DoctorProfileResponse>>(
                "/doctor-profile/me",
                { signal }
            );
            return response.data;
        } catch (error) {
            if (isAxiosError(error) && error.response?.status === 404) return null;
            throw error;
        }
    }

    async updateMyProfile(
        data: UpdateDoctorProfilePayload,
        signal?: AbortSignal
    ): Promise<ApiResponse<{ message: string }>> {
        const response = await httpClient.put<ApiResponse<{ message: string }>>(
            "/doctor-profile/me",
            data,
            { signal }
        );
        return response.data;
    }
}

export const doctorProfileInternalService = new DoctorProfileInternalService();