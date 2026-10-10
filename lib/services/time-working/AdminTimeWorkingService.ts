import { httpClient } from "@/lib/http/client";
import type { ApiResponse } from "@/lib/http/response";
import type { BaseStatus } from "@/types/models";

export type AdminTimeWorkingItem = {
  uuid: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  status: BaseStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type TimeWorkingRequest = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  status: BaseStatus;
};

class AdminTimeWorkingService {
  async getAll(signal?: AbortSignal) {
    const response = await httpClient.get<ApiResponse<AdminTimeWorkingItem[]>>(
      "/admin/time-workings",
      { signal },
    );
    return response.data;
  }

  async create(payload: TimeWorkingRequest) {
    const response = await httpClient.post<ApiResponse<AdminTimeWorkingItem>>(
      "/admin/time-workings",
      payload,
    );
    return response.data;
  }

  async update(uuid: string, payload: TimeWorkingRequest) {
    const response = await httpClient.put<ApiResponse<AdminTimeWorkingItem>>(
      `/admin/time-workings/${uuid}`,
      payload,
    );
    return response.data;
  }

  async delete(uuid: string) {
    await httpClient.delete(`/admin/time-workings/${uuid}`);
  }

  async restore(uuid: string) {
    await httpClient.patch(`/admin/time-workings/${uuid}/restore`);
  }
}

export const adminTimeWorkingService = new AdminTimeWorkingService();
