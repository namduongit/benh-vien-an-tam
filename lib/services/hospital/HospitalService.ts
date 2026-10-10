import { isAxiosError } from "axios";

import { httpClient } from "@/lib/http/client";
import type { ApiResponse, PaginatedData } from "@/lib/http/response";
import type { HospitalDetail } from "@/types/details";
import type { HospitalListQuery } from "@/types/discovery";
import type {
  Department,
  Hospital,
  HospitalAssignmentSelection,
  MedicalService,
} from "@/types/models";

export type HospitalUpdateRequest = Pick<
  Hospital,
  | "Image"
  | "MapUrl"
  | "Slug"
  | "Name"
  | "Address"
  | "NumberOfRoom"
  | "Description"
  | "DetailService"
  | "WorkingHour"
>;

export class HospitalService {
  async getBranchProfile(
    signal?: AbortSignal,
  ): Promise<ApiResponse<Hospital>> {
    const response = await httpClient.get<ApiResponse<Hospital>>(
      "/hospitals/branch-profile",
      { signal },
    );

    return response.data;
  }

  async updateBranchProfile(
    uuid: string,
    request: HospitalUpdateRequest,
  ): Promise<ApiResponse<Hospital>> {
    const response = await httpClient.put<ApiResponse<Hospital>>(
      `/hospitals/${encodeURIComponent(uuid)}`,
      request,
    );

    return response.data;
  }

  async getAssignedDepartments(
    uuid: string,
    signal?: AbortSignal,
  ): Promise<ApiResponse<PaginatedData<Department>>> {
    const response = await httpClient.get<
      ApiResponse<PaginatedData<Department>>
    >(`/hospitals/${encodeURIComponent(uuid)}/departments`, {
      params: { page: 1, pageSize: 100 },
      signal,
    });

    return response.data;
  }

  async getAssignedMedicalServices(
    uuid: string,
    signal?: AbortSignal,
  ): Promise<ApiResponse<PaginatedData<MedicalService>>> {
    const response = await httpClient.get<
      ApiResponse<PaginatedData<MedicalService>>
    >(`/hospitals/${encodeURIComponent(uuid)}/medical-services`, {
      params: { page: 1, pageSize: 100 },
      signal,
    });

    return response.data;
  }

  async updateAssignments(
    uuid: string,
    selection: HospitalAssignmentSelection,
  ): Promise<ApiResponse<HospitalAssignmentSelection>> {
    const response = await httpClient.put<
      ApiResponse<HospitalAssignmentSelection>
    >(`/hospitals/${encodeURIComponent(uuid)}/assignments`, selection);

    return response.data;
  }

  async getBySlug(slug: string): Promise<ApiResponse<HospitalDetail> | null> {
    try {
      const response = await httpClient.get<ApiResponse<HospitalDetail>>(
        `/hospitals/${encodeURIComponent(slug)}`,
      );
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) return null;
      throw error;
    }
  }

  async getAll(
    query: HospitalListQuery = {},
    signal?: AbortSignal,
  ): Promise<ApiResponse<PaginatedData<Hospital>>> {
    const response = await httpClient.get<ApiResponse<PaginatedData<Hospital>>>(
      "/hospitals",
      { params: query, signal },
    );

    return response.data;
  }

  async getOptions(signal?: AbortSignal): Promise<ApiResponse<Hospital[]>> {
    const response = await httpClient.get<ApiResponse<Hospital[]>>(
      "/hospitals/options",
      { signal },
    );

    return response.data;
  }

  async getFeatured(signal?: AbortSignal): Promise<ApiResponse<Hospital[]>> {
    const response = await httpClient.get<ApiResponse<Hospital[]>>(
      "/hospitals/featured",
      { signal },
    );

    return response.data;
  }
}

export const hospitalService = new HospitalService();
