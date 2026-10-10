import { httpClient } from "@/lib/http/client";
import { ApiResponse } from "@/lib/http/response";
import { BaseStatus } from "@/types/models";

export type AdminHospitalItem = {
    uuid: string;
    name: string;
    address: string;
    slug: string;
    image: string;
    mapUrl: string;
    numberOfRoom: number;
    description: string;
    detailService: string;
    workingHour: string;
    status: BaseStatus;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
}

export type CreateHospitalRequest = {
    name: string;
    address: string;
    slug: string;
    image?: string;
    mapUrl?: string;
    numberOfRoom?: number;
    description?: string;
    detailService?: string;
    workingHour?: string;
    status?: BaseStatus;
}

export type UpdateHospitalRequest = CreateHospitalRequest;


export class AdminHospitalService {
    
    async getAll(signal?: AbortSignal): Promise<ApiResponse<AdminHospitalItem[]>> {
        const response = await httpClient.get<ApiResponse<AdminHospitalItem[]>>(
            "/admin/hospitals",
            { signal }
        );

        return response.data;
    }

    async create(
        payload: CreateHospitalRequest
    ): Promise<ApiResponse<AdminHospitalItem>> {
        const response = await httpClient.post<ApiResponse<AdminHospitalItem>>(
            "/admin/hospitals",
            payload
        );

        return response.data;
    }

    async update(
        uuid: string,
        payload: UpdateHospitalRequest
    ): Promise<ApiResponse<AdminHospitalItem>> {
        const response = await httpClient.put<ApiResponse<AdminHospitalItem>>(
            `/admin/hospitals/${uuid}`,
            payload
        );

        return response.data;
    }

    async delete(
        uuid: string
    ): Promise<ApiResponse<null>> {
        const response = await httpClient.delete<ApiResponse<null>>(
            `/admin/hospitals/${uuid}`,
        );

        return response.data;
    }

    async restore(
        uuid: string
    ): Promise<ApiResponse<null>> {
        const response = await httpClient.patch<ApiResponse<null>>(
            `/admin/hospitals/${uuid}/restore`
        );

        return response.data;
    }

}

export const adminHospitalService = new AdminHospitalService();
