import type AxiosMockAdapter from "axios-mock-adapter";

import { featuredHospitals, mockHospitals } from "@/data/mocks/hospitals";
import { mockDepartments } from "@/data/mocks/departments";
import { mockMedicalServices } from "@/data/mocks/medical-services";
import { mockReviewHospitals } from "@/data/mocks/review-hospitals";
import {
  getHospitalAssignments,
  saveHospitalAssignments,
} from "@/lib/mocks/hospital-assignments";
import type { HospitalUpdateRequest } from "@/lib/services/hospital/HospitalService";
import {
  getPositiveIntegerParam,
  getStringParam,
  matchesKeyword,
  paginate,
} from "@/lib/mocks/query-utils";
import {
  BaseStatus,
  type Hospital,
  type HospitalAssignmentSelection,
} from "@/types/models";

const branchProfileStorageKey = "an-tam-mock.branch-profile";

export function registerHospitalRoutes(mock: AxiosMockAdapter) {
  mock.onGet("/hospitals/featured").reply(() => {
    return [
      200,
      {
        Data: featuredHospitals.map(withSavedBranchProfile),
        Message: "Lấy danh sách cơ sở nổi bật thành công.",
      },
    ];
  });

  mock.onGet("/hospitals").reply((config) => {
    const q = getStringParam(config.params, "q");
    const name = getStringParam(config.params, "name");
    const department = getStringParam(config.params, "department");
    const page = getPositiveIntegerParam(config.params, "page", 1);
    const pageSize = getPositiveIntegerParam(config.params, "pageSize", 6);
    const items = mockHospitals.map(withSavedBranchProfile).filter(
      (hospital) =>
        hospital.Status === BaseStatus.Active &&
        matchesKeyword(name, hospital.Name) &&
        matchesKeyword(q, hospital.Name, hospital.Address) &&
        (!department ||
          getHospitalAssignments(hospital.Uuid).DepartmentUuids.includes(
            department,
          )),
    );

    return [
      200,
      {
        Data: paginate(items, page, pageSize),
        Message: "Lấy danh sách cơ sở y tế thành công.",
      },
    ];
  });

  mock.onGet("/hospitals/options").reply(200, {
    Data: mockHospitals
      .filter((hospital) => hospital.Status === BaseStatus.Active)
      .map(withSavedBranchProfile),
    Message: "Lấy lựa chọn cơ sở y tế thành công.",
  });

  mock.onGet("/hospitals/branch-profile").reply(() => {
    const hospital = mockHospitals.find(
      (item) =>
        item.Status === BaseStatus.Active && item.DeletedAt.getTime() === 0,
    );

    if (!hospital) {
      return [
        404,
        { Data: null, Message: "Không tìm thấy hồ sơ chi nhánh mock." },
      ];
    }

    const profile = withSavedBranchProfile(hospital);

    return [
      200,
      {
        Data: profile,
        Message: "Lấy hồ sơ chi nhánh thành công.",
      },
    ];
  });

  mock
    .onGet(/^\/hospitals\/[^/]+\/departments$/)
    .reply((config) => {
      const uuid = getHospitalUuid(config.url);
      const hospital = mockHospitals.find(
        (item) => item.Uuid === uuid && item.DeletedAt.getTime() === 0,
      );

      if (!hospital) {
        return [404, { Data: null, Message: "Không tìm thấy chi nhánh mock." }];
      }

      const { DepartmentUuids } = getHospitalAssignments(uuid);
      const departments = mockDepartments.filter(
        (item) =>
          DepartmentUuids.includes(item.Uuid) &&
          item.Status === BaseStatus.Active,
      );

      return [
        200,
        {
          Data: paginate(
            departments,
            getPositiveIntegerParam(config.params, "page", 1),
            getPositiveIntegerParam(config.params, "pageSize", 20),
          ),
          Message: "Lấy chuyên khoa của chi nhánh thành công.",
        },
      ];
    });

  mock
    .onGet(/^\/hospitals\/[^/]+\/medical-services$/)
    .reply((config) => {
      const uuid = getHospitalUuid(config.url);
      const hospital = mockHospitals.find(
        (item) => item.Uuid === uuid && item.DeletedAt.getTime() === 0,
      );

      if (!hospital) {
        return [404, { Data: null, Message: "Không tìm thấy chi nhánh mock." }];
      }

      const { MedicalServiceUuids } = getHospitalAssignments(uuid);
      const services = mockMedicalServices.filter(
        (item) =>
          MedicalServiceUuids.includes(item.Uuid) &&
          item.Status === BaseStatus.Active,
      );

      return [
        200,
        {
          Data: paginate(
            services,
            getPositiveIntegerParam(config.params, "page", 1),
            getPositiveIntegerParam(config.params, "pageSize", 20),
          ),
          Message: "Lấy dịch vụ của chi nhánh thành công.",
        },
      ];
    });

  mock.onPut(/^\/hospitals\/[^/]+$/).reply((config) => {
    const uuid = decodeURIComponent(config.url?.split("/").pop() ?? "");
    const hospital = mockHospitals.find(
      (item) => item.Uuid === uuid && item.DeletedAt.getTime() === 0,
    );

    if (!hospital) {
      return [404, { Data: null, Message: "Không tìm thấy chi nhánh mock." }];
    }

    const request = parseHospitalUpdateRequest(config.data);
    if (!isValidHospitalUpdateRequest(request)) {
      return [
        400,
        { Data: null, Message: "Thông tin chi nhánh không hợp lệ." },
      ];
    }

    const updatedAt = new Date();
    saveBranchProfile(request, updatedAt);
    Object.assign(hospital, request, { UpdatedAt: updatedAt });

    return [
      200,
      {
        Data: { ...hospital },
        Message: "Cập nhật thông tin chi nhánh thành công.",
      },
    ];
  });

  mock.onPut(/^\/hospitals\/[^/]+\/assignments$/).reply((config) => {
    const uuid = getHospitalUuid(config.url);
    const hospital = mockHospitals.find(
      (item) => item.Uuid === uuid && item.DeletedAt.getTime() === 0,
    );

    if (!hospital) {
      return [404, { Data: null, Message: "Không tìm thấy chi nhánh mock." }];
    }

    const selection = parseHospitalAssignments(config.data);
    if (
      !isValidHospitalAssignments(selection) ||
      !selection.DepartmentUuids.every((id) =>
        mockDepartments.some(
          (item) => item.Uuid === id && item.Status === BaseStatus.Active,
        ),
      ) ||
      !selection.MedicalServiceUuids.every((id) =>
        mockMedicalServices.some(
          (item) => item.Uuid === id && item.Status === BaseStatus.Active,
        ),
      )
    ) {
      return [400, { Data: null, Message: "Phân bổ danh mục không hợp lệ." }];
    }

    const normalizedSelection = {
      DepartmentUuids: [...new Set(selection.DepartmentUuids)],
      MedicalServiceUuids: [...new Set(selection.MedicalServiceUuids)],
    };
    saveHospitalAssignments(uuid, normalizedSelection);

    return [
      200,
      {
        Data: normalizedSelection,
        Message: "Đã lưu phân bổ chuyên khoa và dịch vụ.",
      },
    ];
  });

  mock
    .onGet(/^\/hospitals\/(?!featured$|options$|branch-profile$)[^/]+$/)
    .reply((config) => {
      const slug = decodeURIComponent(config.url?.split("/").pop() ?? "");
      const hospital = mockHospitals.map(withSavedBranchProfile).find(
        (item) => item.Slug === slug && item.Status === BaseStatus.Active,
      );

      if (!hospital) {
        return [404, { Data: null, Message: "Không tìm thấy cơ sở y tế." }];
      }

      const assignments = getHospitalAssignments(hospital.Uuid);
      const departmentUuids = new Set(assignments.DepartmentUuids);
      const serviceUuids = new Set(assignments.MedicalServiceUuids);

      return [
        200,
        {
          Data: {
            Hospital: hospital,
            Departments: mockDepartments.filter(
              (item) =>
                item.Status === BaseStatus.Active && departmentUuids.has(item.Uuid),
            ),
            MedicalServices: mockMedicalServices.filter(
              (item) =>
                item.Status === BaseStatus.Active && serviceUuids.has(item.Uuid),
            ),
            Reviews: mockReviewHospitals
              .filter(
                (review) =>
                  review.HospitalUuid === hospital.Uuid &&
                  review.Status === BaseStatus.Active,
              )
              .sort((a, b) => b.CreatedAt.getTime() - a.CreatedAt.getTime()),
          },
          Message: "Lấy chi tiết cơ sở y tế thành công.",
        },
      ];
    });
}

function getHospitalUuid(url?: string) {
  return decodeURIComponent(url?.split("/")[2] ?? "");
}

function withSavedBranchProfile(hospital: Hospital): Hospital {
  const branchHospital = mockHospitals.find(
    (item) =>
      item.Status === BaseStatus.Active && item.DeletedAt.getTime() === 0,
  );
  const savedProfile = readSavedBranchProfile();

  if (!savedProfile || hospital.Uuid !== branchHospital?.Uuid) {
    return hospital;
  }

  return {
    ...hospital,
    ...savedProfile.profile,
    UpdatedAt: new Date(savedProfile.updatedAt),
  };
}

function parseHospitalUpdateRequest(data: unknown): unknown {
  return typeof data === "string" ? JSON.parse(data) : data;
}

function parseHospitalAssignments(data: unknown): unknown {
  return typeof data === "string" ? JSON.parse(data) : data;
}

function isValidHospitalAssignments(
  value: unknown,
): value is HospitalAssignmentSelection {
  if (!value || typeof value !== "object") return false;
  const selection = value as Partial<HospitalAssignmentSelection>;

  return (
    Array.isArray(selection.DepartmentUuids) &&
    selection.DepartmentUuids.every((uuid) => typeof uuid === "string") &&
    Array.isArray(selection.MedicalServiceUuids) &&
    selection.MedicalServiceUuids.every((uuid) => typeof uuid === "string")
  );
}

function isValidHospitalUpdateRequest(
  value: unknown,
): value is HospitalUpdateRequest {
  if (!value || typeof value !== "object") return false;
  const request = value as Partial<HospitalUpdateRequest>;

  return (
    typeof request.Name === "string" &&
    request.Name.trim().length > 0 &&
    typeof request.Slug === "string" &&
    request.Slug.trim().length > 0 &&
    typeof request.Address === "string" &&
    request.Address.trim().length > 0 &&
    typeof request.WorkingHour === "string" &&
    request.WorkingHour.trim().length > 0 &&
    typeof request.NumberOfRoom === "number" &&
    Number.isInteger(request.NumberOfRoom) &&
    request.NumberOfRoom > 0 &&
    typeof request.Description === "string" &&
    typeof request.Image === "string" &&
    typeof request.MapUrl === "string" &&
    typeof request.DetailService === "string"
  );
}

function readSavedBranchProfile(): {
  profile: HospitalUpdateRequest;
  updatedAt: string;
} | null {
  if (typeof window === "undefined") return null;
  const saved = window.localStorage.getItem(branchProfileStorageKey);
  if (!saved) return null;

  const parsed: unknown = JSON.parse(saved);
  if (
    !parsed ||
    typeof parsed !== "object" ||
    !("profile" in parsed) ||
    !("updatedAt" in parsed) ||
    !isValidHospitalUpdateRequest(parsed.profile) ||
    typeof parsed.updatedAt !== "string" ||
    Number.isNaN(new Date(parsed.updatedAt).getTime())
  ) {
    throw new Error("Dữ liệu hồ sơ chi nhánh mock đã lưu không hợp lệ.");
  }

  return {
    profile: parsed.profile,
    updatedAt: parsed.updatedAt,
  };
}

function saveBranchProfile(
  profile: HospitalUpdateRequest,
  updatedAt: Date,
) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    branchProfileStorageKey,
    JSON.stringify({
      profile,
      updatedAt: updatedAt.toISOString(),
    }),
  );
}
