import { httpClient } from "@/lib/http/client";
import type { ApiResponse } from "@/lib/http/response";
import type { BaseStatus, MedicineUnit } from "@/types/models";

export type AdminMedicineItem = {
  uuid: string;
  image: string;
  name: string;
  description: string;
  price: number;
  unit: MedicineUnit;
  status: BaseStatus;
  isInsured: boolean;
  insuranceCap: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type MedicineRequest = {
  image: string;
  name: string;
  description: string;
  price: number;
  unit: MedicineUnit;
  status: BaseStatus;
  isInsured: boolean;
  insuranceCap: number;
};

class AdminMedicineService {
  async getAll(signal?: AbortSignal) {
    const response = await httpClient.get<ApiResponse<AdminMedicineItem[]>>(
      "/admin/medicines",
      { signal },
    );
    return response.data;
  }

  async create(payload: MedicineRequest) {
    const response = await httpClient.post<ApiResponse<AdminMedicineItem>>(
      "/admin/medicines",
      payload,
    );
    return response.data;
  }

  async update(uuid: string, payload: MedicineRequest) {
    const response = await httpClient.put<ApiResponse<AdminMedicineItem>>(
      `/admin/medicines/${uuid}`,
      payload,
    );
    return response.data;
  }

  async delete(uuid: string) {
    await httpClient.delete(`/admin/medicines/${uuid}`);
  }

  async restore(uuid: string) {
    await httpClient.patch(`/admin/medicines/${uuid}/restore`);
  }
}

export const adminMedicineService = new AdminMedicineService();
