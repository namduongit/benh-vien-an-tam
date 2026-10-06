import type AxiosMockAdapter from "axios-mock-adapter";

import { mockDoctors } from "@/data/mocks/doctors";
import { mockAccounts } from "@/data/mocks/accounts";
import { mockHospitals } from "@/data/mocks/hospitals";
import type {
  DoctorProfileResponse,
  UpdateDoctorProfilePayload,
} from "@/types/doctor-profile";
import type { ApiResponse } from "@/lib/http/response";

// Mock storage for updated doctor profiles
const updatedProfilesMap = new Map<string, Partial<DoctorProfileResponse>>();

// Helper function to get a sample account UUID from authenticated request
// In a real scenario, this would be extracted from the JWT token
function getMockAccountUuid(): string {
  // For demo purposes, return the first doctor's account
  return mockDoctors[0]?.AccountUuid || "2a9a4604-aa8a-4f39-84ea-f6cb613884be";
}

// Helper function to build a DoctorProfileResponse
function buildDoctorProfileResponse(
  accountUuid: string
): DoctorProfileResponse | null {
  const doctor = mockDoctors.find((d) => d.AccountUuid === accountUuid);
  if (!doctor) {
    return null;
  }

  const hospital = mockHospitals.find((h) => h.Uuid === doctor.HospitalUuid);
  const account = mockAccounts.find((a) => a.Uuid === accountUuid);

  // Get updated profile data if it exists
  const updatedData = updatedProfilesMap.get(accountUuid) || {};

  return {
    uuid: doctor.Uuid,
    name: updatedData.name ?? doctor.Name,
    specialty: updatedData.specialty ?? doctor.Specialty,
    workplace: updatedData.workplace ?? doctor.Workplace,
    introduction: updatedData.introduction ?? doctor.Introduction,
    expertise: updatedData.expertise ?? doctor.Expertise,
    hospitalName: hospital?.Name ?? "Chưa phân công",
    departmentDisplay: updatedData.departmentDisplay ?? doctor.DepartmentDisplay ?? "Chưa phân công",
    price: doctor.Price,
    accountStatus: account?.Status ?? "Active",
  };
}

export function registerDoctorProfileRoutes(mock: AxiosMockAdapter) {
  // GET /doctor-profile/me - Get authenticated doctor's profile
  mock.onGet("/doctor-profile/me").reply((config) => {
    const accountUuid = getMockAccountUuid();

    const profileData = buildDoctorProfileResponse(accountUuid);

    if (!profileData) {
      return [
        404,
        {
          Data: null,
          Message: "Không tìm thấy hồ sơ bác sĩ.",
        } as ApiResponse<null>,
      ];
    }

    return [
      200,
      {
        Data: profileData,
        Message: "Lấy hồ sơ bác sĩ thành công.",
      } as ApiResponse<DoctorProfileResponse>,
    ];
  });

  // PUT /doctor-profile/me - Update authenticated doctor's profile
  mock.onPut("/doctor-profile/me").reply((config) => {
    const accountUuid = getMockAccountUuid();

    try {
      const payload: UpdateDoctorProfilePayload = JSON.parse(config.data);

      // Validate required fields
      if (!payload.name?.trim()) {
        return [
          400,
          {
            Data: null,
            Message: "Họ và tên không được để trống.",
          } as ApiResponse<null>,
        ];
      }

      if (!payload.specialty?.trim()) {
        return [
          400,
          {
            Data: null,
            Message: "Chuyên môn không được để trống.",
          } as ApiResponse<null>,
        ];
      }

      if (!payload.workplace?.trim()) {
        return [
          400,
          {
            Data: null,
            Message: "Nơi làm việc không được để trống.",
          } as ApiResponse<null>,
        ];
      }

      if (!payload.introduction?.trim()) {
        return [
          400,
          {
            Data: null,
            Message: "Giới thiệu không được để trống.",
          } as ApiResponse<null>,
        ];
      }

      if (!payload.expertise?.trim()) {
        return [
          400,
          {
            Data: null,
            Message: "Kinh nghiệm và chuyên môn không được để trống.",
          } as ApiResponse<null>,
        ];
      }

      // Store updated profile
      updatedProfilesMap.set(accountUuid, payload);

      return [
        200,
        {
          Data: { message: "Cập nhật hồ sơ bác sĩ thành công." },
          Message: "Cập nhật thành công.",
        } as ApiResponse<{ message: string }>,
      ];
    } catch (error) {
      return [
        400,
        {
          Data: null,
          Message: "Dữ liệu không hợp lệ.",
        } as ApiResponse<null>,
      ];
    }
  });
}
