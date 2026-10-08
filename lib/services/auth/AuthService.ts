import axios from "axios";

import { httpClient } from "@/lib/http/client";
import type { ApiResponse } from "@/lib/http/response";
import type {
  AuthErrorResponse,
  AuthField,
  AuthSession,
  LoginRequest,
  RegisterPatientRequest,
} from "@/types/auth";
import { BaseStatus, Gender, type PatientProfile } from "@/types/models";

const sessionStorageKey = "an-tam-y-te.patient-session";
const mockAccountHeader = "X-Mock-Account-Uuid";

function setMockAccountHeader(accountUuid?: string) {
  if (process.env.NEXT_PUBLIC_USE_MOCK_API === "false") return;
  if (accountUuid) {
    httpClient.defaults.headers.common[mockAccountHeader] = accountUuid;
  } else {
    delete httpClient.defaults.headers.common[mockAccountHeader];
  }
}

export class AuthServiceError extends Error {
  constructor(
    message: string,
    public readonly fieldErrors: Partial<Record<AuthField, string>> = {},
  ) {
    super(message);
    this.name = "AuthServiceError";
  }
}

function toAuthError(error: unknown) {
  if (error instanceof AuthServiceError) {
    return error;
  }

  if (axios.isAxiosError<AuthErrorResponse>(error)) {
    const response = error.response?.data;
    const errors = response?.Errors ?? response?.errors ?? {};
    const fieldErrors = Object.fromEntries(
      Object.entries(errors).map(([field, messages]) => [
        field,
        Array.isArray(messages) ? messages[0] : messages,
      ]),
    ) as Partial<Record<AuthField, string>>;

    return new AuthServiceError(
      response?.Message ??
        response?.message ??
        "Không thể kết nối đến hệ thống. Vui lòng thử lại.",
      fieldErrors,
    );
  }

  return new AuthServiceError("Đã xảy ra lỗi. Vui lòng thử lại.");
}

type ApiEnvelope<T> = {
  Data?: T;
  data?: T;
};

type AuthSessionResponse = {
  account: {
    uuid: string;
    phone: string;
    roleUuid: string | null;
    status: BaseStatus | number;
    hospitalUuid: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  };
  patientProfile: {
    uuid: string;
    accountUuid: string;
    avatar: string;
    name: string;
    gender: Gender | number;
    birthdate: string;
    medicalCode: string;
    email: string;
  };
};

function mapSession(response: AuthSessionResponse): AuthSession {
  const { account, patientProfile } = response;

  return {
    Account: {
      Uuid: account.uuid,
      Phone: account.phone,
      RoleUuid: account.roleUuid ?? "",
      Status: mapBaseStatus(account.status),
      HospitalUuid: account.hospitalUuid,
      CreatedAt: new Date(account.createdAt),
      UpdatedAt: new Date(account.updatedAt),
      DeletedAt: account.deletedAt ? new Date(account.deletedAt) : new Date(0),
    },
    PatientProfile: {
      Uuid: patientProfile.uuid,
      AccountUuid: patientProfile.accountUuid,
      Avatar: patientProfile.avatar,
      Name: patientProfile.name,
      Gender: mapGender(patientProfile.gender),
      Birthdate: new Date(patientProfile.birthdate),
      MedicalCode: patientProfile.medicalCode,
      Email: patientProfile.email,
    },
  };
}

function mapBaseStatus(status: BaseStatus | number): BaseStatus {
  if (status === 0) return BaseStatus.Active;
  if (status === 1) return BaseStatus.InActive;
  return status as BaseStatus;
}

function mapGender(gender: Gender | number): Gender {
  if (gender === 0) return Gender.Other;
  if (gender === 1) return Gender.Male;
  if (gender === 2) return Gender.Female;
  return gender as Gender;
}

function hydrateSession(value: string): AuthSession | null {
  try {
    const session = JSON.parse(value) as AuthSession;

    if (
      session.Account.Status !== BaseStatus.Active ||
      !session.Account.Uuid ||
      !session.PatientProfile?.Uuid
    ) {
      return null;
    }

    return {
      Account: {
        ...session.Account,
        CreatedAt: new Date(session.Account.CreatedAt),
        UpdatedAt: new Date(session.Account.UpdatedAt),
        DeletedAt: new Date(session.Account.DeletedAt),
      },
      PatientProfile: {
        ...session.PatientProfile,
        Birthdate: new Date(session.PatientProfile.Birthdate),
      },
    };
  } catch {
    return null;
  }
}

export class AuthService {
  async login(credentials: LoginRequest): Promise<AuthSession> {
    try {
      const response = await httpClient.post<
        ApiEnvelope<AuthSessionResponse> | ApiResponse<AuthSession>
      >("/auth/login", credentials);
      const payload = "data" in response.data ? response.data.data : response.data.Data;
      if (!payload) {
        throw new AuthServiceError("Dữ liệu phiên đăng nhập không hợp lệ.");
      }
      const session = "account" in payload ? mapSession(payload) : payload;

      localStorage.setItem(sessionStorageKey, JSON.stringify(session));
      setMockAccountHeader(session.Account.Uuid);
      return session;
    } catch (error) {
      throw toAuthError(error);
    }
  }

  async register(request: RegisterPatientRequest): Promise<void> {
    try {
      await httpClient.post<ApiResponse<null>>("/auth/register", request);
    } catch (error) {
      throw toAuthError(error);
    }
  }

  async getCurrentSession(): Promise<AuthSession | null> {
    const storedSession = localStorage.getItem(sessionStorageKey);
    if (!storedSession) {
      setMockAccountHeader();
      return null;
    }

    const session = hydrateSession(storedSession);
    if (!session) {
      localStorage.removeItem(sessionStorageKey);
      setMockAccountHeader();
    } else {
      setMockAccountHeader(session.Account.Uuid);
    }

    return session;
  }

  async logout(): Promise<void> {
    try {
      await httpClient.post<ApiResponse<null>>("/auth/logout");
    } catch (error) {
      throw toAuthError(error);
    } finally {
      localStorage.removeItem(sessionStorageKey);
      setMockAccountHeader();
    }
  }

  persistPatientProfile(profile: PatientProfile) {
    const storedSession = localStorage.getItem(sessionStorageKey);
    if (!storedSession) return;
    const session = hydrateSession(storedSession);
    if (!session || session.Account.Uuid !== profile.AccountUuid) return;
    localStorage.setItem(
      sessionStorageKey,
      JSON.stringify({ ...session, PatientProfile: profile }),
    );
  }
}

export const authService = new AuthService();
