import type { BaseStatus, Guid } from "@/types/models";

/**
 * Dữ liệu response cho trang Hồ sơ nghề nghiệp (Internal)
 */
export type DoctorProfileResponse = {
    uuid: Guid;
    name: string;
    specialty: string;
    workplace: string;
    introduction: string;
    expertise: string;
    hospitalName: string;
    departmentDisplay: string;
    price: number;
    accountStatus: BaseStatus | string;
};

/**
 * Payload gửi lên khi Cập nhật Hồ sơ nghề nghiệp (Internal)
 */
export type UpdateDoctorProfilePayload = {
    name: string;
    specialty: string;
    workplace: string;
    introduction: string;
    expertise: string;
};