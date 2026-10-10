import { httpClient } from "@/lib/http/client";
import type { ApiResponse } from "@/lib/http/response";
import type { BaseStatus, Gender } from "@/types/models";

export type AdminAccountItem = {
  uuid: string;
  phone: string;
  roleUuid: string | null;
  roleName: string | null;
  roleIsDoctor: boolean;
  status: BaseStatus;
  hospitalUuid: string | null;
  hospitalName: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  patientProfile: {
    uuid: string;
    avatar: string;
    name: string;
    gender: Gender;
    birthdate: string;
    medicalCode: string;
    email: string;
  } | null;
  doctorProfile: {
    uuid: string;
    avatar: string;
    slug: string;
    name: string;
    price: number;
    departmentDisplay: string;
    introduction: string;
    expertise: string;
    specialty: string;
    workplace: string;
    isFeatured: boolean;
    hospitalUuid: string | null;
  } | null;
};

export type AdminAccountOptions = {
  roles: Array<{ uuid: string; name: string; isDoctor: boolean }>;
  hospitals: Array<{ uuid: string; name: string }>;
};

export type CreateAccountRequest = {
  phone: string;
  password: string;
  roleUuid: string;
  hospitalUuid: string | null;
  status: BaseStatus;
  name: string;
  gender?: Gender;
  birthdate?: string;
  email?: string;
  slug?: string;
  avatar?: string;
  medicalCode?: string;
  price?: number;
  departmentDisplay?: string;
  introduction?: string;
  expertise?: string;
  specialty?: string;
  workplace?: string;
  isFeatured?: boolean;
};

export type UpdateAccountRequest = Omit<CreateAccountRequest, "password"> & {
  password?: string;
};

class AdminAccountService {
  async getAll(signal?: AbortSignal) {
    const response = await httpClient.get<ApiResponse<AdminAccountItem[]>>(
      "/admin/accounts",
      { signal },
    );
    return response.data;
  }

  async getOptions(signal?: AbortSignal) {
    const response = await httpClient.get<ApiResponse<AdminAccountOptions>>(
      "/admin/accounts/options",
      { signal },
    );
    return response.data;
  }

  async create(payload: CreateAccountRequest) {
    const response = await httpClient.post<ApiResponse<AdminAccountItem>>(
      "/admin/accounts",
      payload,
    );
    return response.data;
  }

  async update(uuid: string, payload: UpdateAccountRequest) {
    const response = await httpClient.put<ApiResponse<AdminAccountItem>>(
      `/admin/accounts/${uuid}`,
      payload,
    );
    return response.data;
  }

  async delete(uuid: string) {
    await httpClient.delete(`/admin/accounts/${uuid}`);
  }

  async restore(uuid: string) {
    await httpClient.patch(`/admin/accounts/${uuid}/restore`);
  }
}

export const adminAccountService = new AdminAccountService();
