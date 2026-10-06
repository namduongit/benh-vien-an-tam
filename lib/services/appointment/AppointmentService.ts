import axios from "axios";

import { httpClient } from "@/lib/http/client";
import type { ApiResponse } from "@/lib/http/response";
import type {
  Appointment,
  AppointmentConfirmation,
  AppointmentErrorResponse,
  AppointmentList,
  AppointmentListQuery,
  AppointmentPresentation,
  Availability,
  BookingContext,
  BookingType,
  CreateAppointmentRequest,
  CreateWalkInAppointmentRequest,
  RescheduleAppointmentRequest,
} from "@/types/appointments";

export class AppointmentServiceError extends Error {
  constructor(
    message: string,
    public readonly code = "UNKNOWN",
    public readonly status?: number,
  ) {
    super(message);
    this.name = "AppointmentServiceError";
  }
}

function toAppointmentError(error: unknown) {
  if (axios.isAxiosError<AppointmentErrorResponse>(error)) {
    return new AppointmentServiceError(
      error.response?.data?.Message ??
        "Không thể kết nối đến hệ thống. Vui lòng thử lại.",
      error.response?.data?.Code,
      error.response?.status,
    );
  }
  return new AppointmentServiceError("Đã xảy ra lỗi. Vui lòng thử lại.");
}

export class AppointmentService {
  async getAll(query: AppointmentListQuery, signal?: AbortSignal) {
    try {
      const response = await httpClient.get<ApiResponse<AppointmentList>>(
        "/appointments",
        { params: query, signal },
      );
      return {
        ...response.data,
        Data: {
          ...response.data.Data,
          Items: response.data.Data.Items.map(hydratePresentation),
        },
      };
    } catch (error) {
      throw toAppointmentError(error);
    }
  }

  async getBookingContext(signal?: AbortSignal) {
    try {
      const response = await httpClient.get<ApiResponse<BookingContext>>(
        "/appointments/booking-context",
        { signal },
      );
      return response.data;
    } catch (error) {
      throw toAppointmentError(error);
    }
  }

  async getAvailability(
    query: {
      type: BookingType;
      targetUuid: string;
      hospitalUuid: string;
      accountUuid: string;
      date: string;
    },
    signal?: AbortSignal,
  ) {
    try {
      const response = await httpClient.get<ApiResponse<Availability>>(
        "/appointments/availability",
        { params: query, signal },
      );
      return response.data;
    } catch (error) {
      throw toAppointmentError(error);
    }
  }

  async create(request: CreateAppointmentRequest) {
    try {
      const { Type, ...payload } = request;
      const endpoint =
        Type === "hospital"
          ? "hospitals"
          : Type === "doctor"
            ? "doctors"
            : "medical-services";
      const response = await httpClient.post<ApiResponse<Appointment>>(
        `/appointments/${endpoint}`,
        payload,
      );
      return {
        ...response.data,
        Data: hydrateAppointment(response.data.Data),
      };
    } catch (error) {
      throw toAppointmentError(error);
    }
  }

  async createWalkIn(request: CreateWalkInAppointmentRequest) {
    try {
      const response = await httpClient.post<ApiResponse<Appointment>>(
        "/appointments/walk-in",
        request,
      );
      return {
        ...response.data,
        Data: hydrateAppointment(response.data.Data),
      };
    } catch (error) {
      throw toAppointmentError(error);
    }
  }

  async getWalkInAvailability(
    query: {
      type: BookingType;
      targetUuid: string;
      hospitalUuid: string;
      date: string;
    },
    signal?: AbortSignal,
  ) {
    try {
      const response = await httpClient.get<ApiResponse<Availability>>(
        "/appointments/walk-in/availability",
        { params: query, signal },
      );
      return response.data;
    } catch (error) {
      throw toAppointmentError(error);
    }
  }

  async getConfirmation(
    appointmentUuid: string,
    accountUuid: string,
    signal?: AbortSignal,
  ) {
    try {
      const response = await httpClient.get<
        ApiResponse<AppointmentConfirmation>
      >(`/appointments/${encodeURIComponent(appointmentUuid)}`, {
        params: { accountUuid },
        signal,
      });
      return {
        ...response.data,
        Data: {
          ...response.data.Data,
          Appointment: hydrateAppointment(response.data.Data.Appointment),
        },
      };
    } catch (error) {
      throw toAppointmentError(error);
    }
  }

  async getDetail(
    appointmentUuid: string,
    accountUuid: string,
    signal?: AbortSignal,
  ) {
    try {
      const response = await httpClient.get<ApiResponse<AppointmentPresentation>>(
        `/appointments/${encodeURIComponent(appointmentUuid)}/detail`,
        { params: { accountUuid }, signal },
      );
      return { ...response.data, Data: hydratePresentation(response.data.Data) };
    } catch (error) {
      throw toAppointmentError(error);
    }
  }

  async reschedule(
    appointmentUuid: string,
    request: RescheduleAppointmentRequest,
  ) {
    try {
      const response = await httpClient.post<ApiResponse<AppointmentPresentation>>(
        `/appointments/${encodeURIComponent(appointmentUuid)}/reschedule`,
        request,
      );
      return { ...response.data, Data: hydratePresentation(response.data.Data) };
    } catch (error) {
      throw toAppointmentError(error);
    }
  }

  async cancel(appointmentUuid: string, accountUuid: string) {
    try {
      const response = await httpClient.post<ApiResponse<AppointmentPresentation>>(
        `/appointments/${encodeURIComponent(appointmentUuid)}/cancel`,
        { AccountUuid: accountUuid },
      );
      return { ...response.data, Data: hydratePresentation(response.data.Data) };
    } catch (error) {
      throw toAppointmentError(error);
    }
  }
}

function hydrateAppointment<T extends Appointment>(appointment: T): T {
  return {
    ...appointment,
    AppointmentAt: new Date(appointment.AppointmentAt),
    CreatedAt: new Date(appointment.CreatedAt),
    UpdatedAt: new Date(appointment.UpdatedAt),
  };
}

function hydratePresentation<T extends AppointmentPresentation>(item: T): T {
  return {
    ...item,
    Appointment: hydrateAppointment(item.Appointment),
  };
}

export const appointmentService = new AppointmentService();
