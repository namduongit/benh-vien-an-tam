import { httpClient } from "@/lib/http/client";
import type { ApiResponse, PaginatedData } from "@/lib/http/response";
import { BaseStatus, type Guid } from "@/types/models";

export type StaffRoleCode = "Doctor" | "Staff" | "WarehouseManager";

export type HospitalStaffMember = {
  AccountUuid: Guid;
  DoctorUuid: Guid | null;
  DisplayName: string;
  Phone: string;
  RoleCode: StaffRoleCode;
  RoleName: string;
  DepartmentUuid: Guid | null;
  DepartmentName: string | null;
  Specialty: string | null;
  Status: BaseStatus;
  CreatedAt: Date;
  UpdatedAt: Date;
};

export type HospitalStaffQuery = {
  search?: string;
  role?: StaffRoleCode;
  status?: BaseStatus;
  page?: number;
  pageSize?: number;
};

export type CreateHospitalStaffRequest = {
  Phone: string;
  Password: string;
  RoleCode: StaffRoleCode;
  Name?: string;
  Specialty?: string;
  Price?: number;
  DepartmentUuid?: Guid;
};

export type HospitalStaffStatusResult = {
  AccountUuid: Guid;
  Status: BaseStatus;
  UpdatedAt: Date;
};

type StaffApiDto = {
  accountUuid: Guid;
  doctorUuid: Guid | null;
  displayName: string;
  phone: string;
  roleCode: StaffRoleCode;
  roleName: string;
  departmentUuid: Guid | null;
  departmentName: string | null;
  specialty: string | null;
  status: BaseStatus;
  createdAt: string;
  updatedAt: string;
};

type StaffListApiResponse = {
  message: string;
  data: StaffApiDto[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
};

type StaffApiResponse = {
  message: string;
  data: StaffApiDto;
};

type StaffStatusApiResponse = {
  message: string;
  data: {
    accountUuid: Guid;
    status: BaseStatus;
    updatedAt: string;
  };
};

export class StaffService {
  async getAll(
    hospitalUuid: Guid,
    query: HospitalStaffQuery = {},
    signal?: AbortSignal,
  ): Promise<ApiResponse<PaginatedData<HospitalStaffMember>>> {
    const response = await httpClient.get<StaffListApiResponse>(
      `/hospitals/${encodeURIComponent(hospitalUuid)}/staff`,
      { params: query, signal },
    );
    return {
      Message: response.data.message,
      Data: {
        Items: response.data.data.map(toStaffMember),
        Page: response.data.pagination.page,
        PageSize: response.data.pagination.pageSize,
        TotalItems: response.data.pagination.totalCount,
        TotalPages: response.data.pagination.totalPages,
      },
    };
  }

  async create(
    hospitalUuid: Guid,
    request: CreateHospitalStaffRequest,
  ): Promise<ApiResponse<HospitalStaffMember>> {
    const response = await httpClient.post<StaffApiResponse>(
      `/hospitals/${encodeURIComponent(hospitalUuid)}/staff`,
      {
        phone: request.Phone,
        password: request.Password,
        roleCode: request.RoleCode,
        name: request.Name,
        specialty: request.Specialty,
        price: request.Price,
        departmentUuid: request.DepartmentUuid,
      },
    );
    return {
      Message: response.data.message,
      Data: toStaffMember(response.data.data),
    };
  }

  async updateStatus(
    hospitalUuid: Guid,
    accountUuid: Guid,
    status: BaseStatus,
  ): Promise<ApiResponse<HospitalStaffStatusResult>> {
    const response = await httpClient.put<StaffStatusApiResponse>(
      `/hospitals/${encodeURIComponent(hospitalUuid)}/staff/${encodeURIComponent(accountUuid)}/status`,
      { status },
    );
    return {
      Message: response.data.message,
      Data: {
        AccountUuid: response.data.data.accountUuid,
        Status: response.data.data.status,
        UpdatedAt: new Date(response.data.data.updatedAt),
      },
    };
  }
}

function toStaffMember(staff: StaffApiDto): HospitalStaffMember {
  return {
    AccountUuid: staff.accountUuid,
    DoctorUuid: staff.doctorUuid,
    DisplayName: staff.displayName,
    Phone: staff.phone,
    RoleCode: staff.roleCode,
    RoleName: staff.roleName,
    DepartmentUuid: staff.departmentUuid,
    DepartmentName: staff.departmentName,
    Specialty: staff.specialty,
    Status: staff.status,
    CreatedAt: new Date(staff.createdAt),
    UpdatedAt: new Date(staff.updatedAt),
  };
}

export const staffService = new StaffService();