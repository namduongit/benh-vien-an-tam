import type AxiosMockAdapter from "axios-mock-adapter";

import { mockAccounts } from "@/data/mocks/accounts";
import { mockDepartments } from "@/data/mocks/departments";
import { mockDoctorDepartments } from "@/data/mocks/doctor-departments";
import { mockDoctors } from "@/data/mocks/doctors";
import { mockHospitalDepartments } from "@/data/mocks/hospital-departments";
import { mockHospitals } from "@/data/mocks/hospitals";
import { mockRoles } from "@/data/mocks/roles";
import {
  getPositiveIntegerParam,
  getStringParam,
  matchesKeyword,
} from "@/lib/mocks/query-utils";
import {
  BaseStatus,
  ROLE_UUIDS,
  type Account,
  type DoctorProfile,
} from "@/types/models";
import type { StaffRoleCode } from "@/lib/services/hospital/StaffService";

type CreatePayload = {
  phone?: unknown;
  password?: unknown;
  roleCode?: unknown;
  name?: unknown;
  specialty?: unknown;
  price?: unknown;
  departmentUuid?: unknown;
};

export function registerStaffRoutes(mock: AxiosMockAdapter) {
  mock.onGet(/^\/hospitals\/[^/]+\/staff$/).reply((config) => {
    const hospitalUuid = getHospitalUuid(config.url);
    if (!hospitalExists(hospitalUuid)) return notFound();

    const role = getStringParam(config.params, "role");
    const status = getStringParam(config.params, "status");
    const search = getStringParam(config.params, "search");
    if (role && !isStaffRole(role)) {
      return [400, { message: "Staff role is invalid", error: "INVALID_STAFF_ROLE" }];
    }
    if (status && !Object.values(BaseStatus).includes(status as BaseStatus)) {
      return [400, { message: "Account status is invalid" }];
    }

    const page = getPositiveIntegerParam(config.params, "page", 1);
    const pageSize = Math.min(
      getPositiveIntegerParam(config.params, "pageSize", 100),
      100,
    );
    const items = mockAccounts
      .filter(
        (account) =>
          account.HospitalUuid === hospitalUuid &&
          account.DeletedAt.getTime() === 0 &&
          isStaffAccount(account) &&
          (!role || roleCodeFor(account) === role) &&
          (!status || account.Status === status) &&
          matchesKeyword(search, ...getStaffSearchValues(account)),
      )
      .map((account) => toStaffDto(account, hospitalUuid))
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      );
    const totalCount = items.length;
    const totalPages = Math.ceil(totalCount / pageSize);

    return [
      200,
      {
        message: "Fetched successfully",
        data: items.slice((page - 1) * pageSize, page * pageSize),
        pagination: { page, pageSize, totalCount, totalPages },
      },
    ];
  });

  mock.onPost(/^\/hospitals\/[^/]+\/staff$/).reply((config) => {
    const hospitalUuid = getHospitalUuid(config.url);
    if (!hospitalExists(hospitalUuid)) return notFound();

    const payload = parsePayload(config.data);
    if (!isValidPayload(payload)) {
      return [400, { message: "Staff account details are invalid", error: "INVALID_STAFF_REQUEST" }];
    }
    if (mockAccounts.some((account) => account.Phone === payload.phone.trim())) {
      return [409, { message: "Phone number is already in use", error: "PHONE_ALREADY_EXISTS" }];
    }

    let departmentUuid: string | null = null;
    if (payload.roleCode === "Doctor") {
      if (
        typeof payload.departmentUuid !== "string" ||
        !payload.name ||
        !payload.specialty ||
        typeof payload.price !== "number" ||
        !Number.isInteger(payload.price) ||
        payload.price < 0
      ) {
        return [400, { message: "Doctor name, specialty, department, and a valid consultation price are required", error: "DOCTOR_PROFILE_REQUIRED" }];
      }
      const assignment = mockHospitalDepartments.find(
        (item) =>
          item.HospitalUuid === hospitalUuid &&
          item.DepartmentUuid === payload.departmentUuid,
      );
      const department = mockDepartments.find(
        (item) =>
          item.Uuid === payload.departmentUuid &&
          item.Status === BaseStatus.Active &&
          item.DeletedAt.getTime() === 0,
      );
      if (!assignment || !department) {
        return [400, { message: "Department is not assigned to this hospital", error: "DEPARTMENT_NOT_ASSIGNED" }];
      }
      departmentUuid = department.Uuid;
    }

    const accountUuid = crypto.randomUUID();
    const now = new Date();
    const account: Account = {
      Uuid: accountUuid,
      Phone: payload.phone.trim(),
      Password: payload.password,
      RoleUuid: roleUuidFor(payload.roleCode),
      Status: BaseStatus.Active,
      HospitalUuid: hospitalUuid,
      CreatedAt: now,
      UpdatedAt: now,
      DeletedAt: new Date(0),
    };
    mockAccounts.push(account);

    if (payload.roleCode === "Doctor" && departmentUuid) {
      const hospital = mockHospitals.find((item) => item.Uuid === hospitalUuid)!;
      const doctorUuid = crypto.randomUUID();
      const name = payload.name!.trim();
      const department = mockDepartments.find((item) => item.Uuid === departmentUuid)!;
      const doctor: DoctorProfile = {
        Uuid: doctorUuid,
        Avatar: "/images/doctor-placeholder.svg",
        Slug: `${toSlug(name)}-${doctorUuid.slice(0, 8)}`,
        Name: name,
        Price: payload.price as number,
        DepartmentDisplay: department.Name,
        Introduction: "Hồ sơ bác sĩ mới.",
        Expertise: payload.specialty!.trim(),
        Specialty: payload.specialty!.trim(),
        Workplace: hospital.Name,
        IsFeatured: false,
        AccountUuid: accountUuid,
        HospitalUuid: hospitalUuid,
      };
      mockDoctors.push(doctor);
      mockDoctorDepartments.push({
        Uuid: crypto.randomUUID(),
        DoctorUuid: doctorUuid,
        DepartmentUuid: departmentUuid,
      });
    }

    return [201, { message: "Created successfully", data: toStaffDto(account, hospitalUuid) }];
  });

  mock
    .onPut(/^\/hospitals\/[^/]+\/staff\/[^/]+\/status$/)
    .reply((config) => {
      const [hospitalUuid, accountUuid] = getRouteIds(config.url);
      if (!hospitalExists(hospitalUuid)) return notFound();

      const account = mockAccounts.find(
        (item) =>
          item.Uuid === accountUuid &&
          item.HospitalUuid === hospitalUuid &&
          item.DeletedAt.getTime() === 0 &&
          isStaffAccount(item),
      );
      if (!account) return notFound("Staff account not found");

      const payload = parsePayload(config.data);
      if (
        !payload ||
        typeof payload !== "object" ||
        !Object.values(BaseStatus).includes(payload.status as BaseStatus)
      ) {
        return [400, { message: "Account status is invalid" }];
      }

      account.Status = payload.status as BaseStatus;
      account.UpdatedAt = new Date();
      return [
        200,
        {
          message: "Updated successfully",
          data: {
            accountUuid: account.Uuid,
            status: account.Status,
            updatedAt: account.UpdatedAt.toISOString(),
          },
        },
      ];
    });
}

function getHospitalUuid(url?: string) {
  return decodeURIComponent(url?.split("/")[2] ?? "");
}

function getRouteIds(url?: string) {
  const parts = url?.split("/") ?? [];
  return [decodeURIComponent(parts[2] ?? ""), decodeURIComponent(parts[4] ?? "")];
}

function hospitalExists(uuid: string) {
  return mockHospitals.some(
    (hospital) => hospital.Uuid === uuid && hospital.DeletedAt.getTime() === 0,
  );
}

function isStaffAccount(account: Account) {
  return (
    account.RoleUuid === ROLE_UUIDS.DOCTOR ||
    account.RoleUuid === ROLE_UUIDS.STAFF ||
    account.RoleUuid === ROLE_UUIDS.WAREHOUSE_MANAGER
  );
}

function roleCodeFor(account: Account): StaffRoleCode {
  if (account.RoleUuid === ROLE_UUIDS.DOCTOR) return "Doctor";
  if (account.RoleUuid === ROLE_UUIDS.WAREHOUSE_MANAGER) return "WarehouseManager";
  return "Staff";
}

function roleUuidFor(roleCode: StaffRoleCode) {
  switch (roleCode) {
    case "Doctor":
      return ROLE_UUIDS.DOCTOR;
    case "WarehouseManager":
      return ROLE_UUIDS.WAREHOUSE_MANAGER;
    case "Staff":
      return ROLE_UUIDS.STAFF;
  }
}

function toStaffDto(account: Account, hospitalUuid: string) {
  const roleCode = roleCodeFor(account);
  const doctor = mockDoctors.find((item) => item.AccountUuid === account.Uuid);
  const relation = doctor
    ? mockDoctorDepartments.find((item) => item.DoctorUuid === doctor.Uuid)
    : undefined;
  const department = relation
    ? mockDepartments.find((item) => item.Uuid === relation.DepartmentUuid)
    : undefined;
  const role = mockRoles.find((item) => item.Uuid === account.RoleUuid);

  return {
    accountUuid: account.Uuid,
    doctorUuid: doctor?.Uuid ?? null,
    displayName: doctor?.Name ?? account.Phone,
    phone: account.Phone,
    roleCode,
    roleName: role?.Name ?? roleCode,
    departmentUuid: department?.Uuid ?? null,
    departmentName: department?.Name ?? null,
    specialty: doctor?.Specialty ?? null,
    status: account.Status,
    createdAt: account.CreatedAt.toISOString(),
    updatedAt: account.UpdatedAt.toISOString(),
    hospitalUuid,
  };
}

function getStaffSearchValues(account: Account) {
  const dto = toStaffDto(account, account.HospitalUuid ?? "");
  return [dto.displayName, dto.phone, dto.roleName, dto.departmentName ?? ""];
}

function isValidPayload(
  payload: CreatePayload,
): payload is CreatePayload & {
  phone: string;
  password: string;
  roleCode: StaffRoleCode;
  name?: string;
  specialty?: string;
  departmentUuid?: string;
} {
  if (!payload || typeof payload !== "object") return false;
  if (
    typeof payload.phone !== "string" ||
    !/^[0-9+()\-\s]{8,20}$/.test(payload.phone.trim()) ||
    typeof payload.password !== "string" ||
    payload.password.length < 8 ||
    payload.password.length > 128 ||
    !isStaffRole(payload.roleCode)
  ) {
    return false;
  }
  if (payload.name !== undefined && (typeof payload.name !== "string" || payload.name.trim().length < 2 || payload.name.length > 100)) return false;
  if (payload.specialty !== undefined && (typeof payload.specialty !== "string" || payload.specialty.trim().length < 2 || payload.specialty.length > 100)) return false;
  if (payload.price !== undefined && (typeof payload.price !== "number" || !Number.isInteger(payload.price) || payload.price < 0)) return false;
  return payload.departmentUuid === undefined || typeof payload.departmentUuid === "string";
}

function isStaffRole(value: unknown): value is StaffRoleCode {
  return value === "Doctor" || value === "Staff" || value === "WarehouseManager";
}

function parsePayload(data: unknown): Record<string, unknown> {
  if (typeof data === "string") {
    try {
      const parsed: unknown = JSON.parse(data);
      return isRecord(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return isRecord(data) ? data : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function notFound(message = "Hospital not found"): [number, { message: string; error: string }] {
  return [404, { message, error: "Resource does not exist" }];
}