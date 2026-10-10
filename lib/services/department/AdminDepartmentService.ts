import { httpClient } from "@/lib/http/client";
import type { ApiResponse } from "@/lib/http/response";
import type { BaseStatus } from "@/types/models";

export type AdminDepartmentItem = {
  uuid: string;
  icon: string;
  slug: string;
  name: string;
  description: string;
  status: BaseStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type DepartmentRequest = {
  icon: string;
  slug: string;
  name: string;
  description: string;
  status: BaseStatus;
};

class AdminDepartmentService {
  async getAll(signal?: AbortSignal) {
    const response = await httpClient.get<ApiResponse<AdminDepartmentItem[]>>(
      "/admin/departments",
      { signal },
    );
    return response.data;
  }

  async create(payload: DepartmentRequest) {
    const response = await httpClient.post<ApiResponse<AdminDepartmentItem>>(
      "/admin/departments",
      payload,
    );
    return response.data;
  }

  async update(uuid: string, payload: DepartmentRequest) {
    const response = await httpClient.put<ApiResponse<AdminDepartmentItem>>(
      `/admin/departments/${uuid}`,
      payload,
    );
    return response.data;
  }

  async delete(uuid: string) {
    await httpClient.delete(`/admin/departments/${uuid}`);
  }

  async restore(uuid: string) {
    await httpClient.patch(`/admin/departments/${uuid}/restore`);
  }
}

export const adminDepartmentService = new AdminDepartmentService();
