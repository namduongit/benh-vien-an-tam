import type AxiosMockAdapter from "axios-mock-adapter";

import { mockAccounts } from "@/data/mocks/accounts";
import { mockPatientProfiles } from "@/data/mocks/patient-profiles";
import type {
  AuthSession,
  LoginRequest,
  PublicAccount,
  RegisterPatientRequest,
} from "@/types/auth";
import { BaseStatus, ROLE_UUIDS, type Account } from "@/types/models";

function normalizePhone(phone: string) {
  return phone.replace(/[\s.-]/g, "");
}

function toPublicAccount(account: Account): PublicAccount {
  return {
    Uuid: account.Uuid,
    Phone: account.Phone,
    RoleUuid: account.RoleUuid,
    Status: account.Status,
    HospitalUuid: account.HospitalUuid,
    CreatedAt: account.CreatedAt,
    UpdatedAt: account.UpdatedAt,
    DeletedAt: account.DeletedAt,
  };
}

function parseBody<T>(data: unknown): T {
  return typeof data === "string" ? (JSON.parse(data) as T) : (data as T);
}

export function registerAuthRoutes(mock: AxiosMockAdapter) {
  mock.onPost("/auth/login").reply((config) => {
    const credentials = parseBody<LoginRequest>(config.data);
    const phone = normalizePhone(credentials.Phone);
    const account = mockAccounts.find(
      (candidate) => normalizePhone(candidate.Phone) === phone,
    );

    if (!account || account.Password !== credentials.Password) {
      return [401, { Message: "Số điện thoại hoặc mật khẩu không đúng." }];
    }

    if (account.Status === BaseStatus.InActive) {
      return [403, { Message: "Tài khoản đã bị vô hiệu hóa." }];
    }

    if (account.RoleUuid !== ROLE_UUIDS.PATIENT) {
      return [403, { Message: "Tài khoản không thuộc phạm vi người bệnh." }];
    }

    const profile = mockPatientProfiles.find(
      (candidate) => candidate.AccountUuid === account.Uuid,
    );

    if (!profile) {
      return [409, { Message: "Tài khoản chưa có hồ sơ người bệnh hợp lệ." }];
    }

    const session: AuthSession = {
      Account: toPublicAccount(account),
      PatientProfile: profile,
    };

    return [200, { Data: session, Message: "Đăng nhập thành công." }];
  });

  mock.onPost("/auth/register").reply((config) => {
    const request = parseBody<RegisterPatientRequest>(config.data);
    const phone = normalizePhone(request.Phone);

    if (
      mockAccounts.some(
        (candidate) => normalizePhone(candidate.Phone) === phone,
      )
    ) {
      return [
        409,
        {
          Message: "Không thể tạo tài khoản.",
          Errors: { Phone: "Số điện thoại đã được sử dụng." },
        },
      ];
    }

    const now = new Date();
    const accountUuid = crypto.randomUUID();
    const account: Account = {
      Uuid: accountUuid,
      Phone: phone,
      Password: request.Password,
      RoleUuid: ROLE_UUIDS.PATIENT,
      Status: BaseStatus.Active,
      HospitalUuid: null,
      CreatedAt: now,
      UpdatedAt: now,
      DeletedAt: new Date(0),
    };
    const profile = {
      Uuid: crypto.randomUUID(),
      Avatar: "",
      Name: request.Name.trim(),
      Gender: request.Gender,
      Birthdate: new Date(`${request.Birthdate}T00:00:00`),
      MedicalCode: `BN${Date.now().toString().slice(-8)}`,
      Email: request.Email.trim().toLowerCase(),
      AccountUuid: accountUuid,
    };

    mockAccounts.push(account);
    mockPatientProfiles.push(profile);

    return [201, { Data: null, Message: "Đăng ký tài khoản thành công." }];
  });

  mock.onPost("/auth/logout").reply(200, {
    Data: null,
    Message: "Đăng xuất thành công.",
  });
}
