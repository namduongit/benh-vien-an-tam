import { httpClient } from "@/lib/http/client";
import type { ApiResponse, PaginatedData } from "@/lib/http/response";
import {
  AppointmentMedicalServiceStatus,
  AppointmentStatus,
  AppointmentType,
  type Guid,
  type RoomStatus,
} from "@/types/models";

export type BranchAppointmentServiceItem = {
  Uuid: Guid;
  MedicalServiceUuid: Guid | null;
  Name: string;
  Price: number;
  Description: string;
  Status: AppointmentMedicalServiceStatus;
};

export type BranchAppointment = {
  Uuid: Guid;
  PatientName: string;
  Gender: string;
  MedicalCode: string;
  Note: string;
  AppointmentDate: Date;
  TimeSlot: Guid | null;
  Time: string;
  Type: AppointmentType;
  Status: AppointmentStatus;
  PatientUuid: Guid | null;
  HospitalUuid: Guid;
  DoctorUuid: Guid | null;
  DoctorName: string | null;
  MedicalServiceUuid: Guid | null;
  MedicalServiceName: string | null;
  RoomUuid: Guid | null;
  RoomName: string | null;
  DoctorNote: string;
  TotalPrice: number;
  IsPaid: boolean;
  IsWalkIn: boolean;
  CreatedAt: Date;
  UpdatedAt: Date;
  Services: BranchAppointmentServiceItem[];
};

export type BranchAppointmentQuery = {
  from?: string;
  to?: string;
  status?: AppointmentStatus;
  type?: AppointmentType;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type BranchAppointmentResources = {
  Rooms: Array<{ Uuid: Guid; Name: string; Status: RoomStatus }>;
  Doctors: Array<{ Uuid: Guid; Name: string }>;
  Services: Array<{ Uuid: Guid; Name: string; Price: number }>;
  TimeWorkings: Array<{
    Uuid: Guid;
    DayOfWeek: number;
    StartTime: string;
    EndTime: string;
  }>;
};

type ApiServiceItem = {
  uuid: Guid;
  medicalServiceUuid: Guid | null;
  name: string;
  price: number;
  description: string;
  status: AppointmentMedicalServiceStatus;
};
type ApiAppointment = {
  uuid: Guid;
  patientName: string;
  gender: string;
  medicalCode: string;
  note: string;
  appointmentDate: string;
  timeSlot: Guid | null;
  time: string;
  type: AppointmentType;
  status: AppointmentStatus;
  patientUuid: Guid | null;
  hospitalUuid: Guid | null;
  doctorUuid: Guid | null;
  doctorName: string | null;
  medicalServiceUuid: Guid | null;
  medicalServiceName: string | null;
  roomUuid: Guid | null;
  roomName: string | null;
  doctorNote: string;
  totalPrice: number;
  isPaid: boolean;
  isWalkIn: boolean;
  createdAt: string;
  updatedAt: string;
  services: ApiServiceItem[];
};
type AppointmentResponse = { message: string; data: ApiAppointment };
type AppointmentListResponse = {
  message: string;
  data: ApiAppointment[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
};
type ResourcesApiResponse = {
  message: string;
  data: {
    rooms: Array<{ uuid: Guid; name: string; status: RoomStatus }>;
    doctors: Array<{ uuid: Guid; name: string }>;
    services: Array<{ uuid: Guid; name: string; price: number }>;
    timeWorkings: Array<{
      uuid: Guid;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }>;
  };
};

export class BranchAppointmentService {
  private endpoint(hospitalUuid: Guid) {
    return `/hospitals/${encodeURIComponent(hospitalUuid)}/appointments`;
  }

  async getResources(
    hospitalUuid: Guid,
    signal?: AbortSignal,
  ): Promise<ApiResponse<BranchAppointmentResources>> {
    const response = await httpClient.get<ResourcesApiResponse>(
      `${this.endpoint(hospitalUuid)}/resources`,
      { signal },
    );
    return {
      Message: response.data.message,
      Data: {
        Rooms: response.data.data.rooms.map((room) => ({
          Uuid: room.uuid,
          Name: room.name,
          Status: room.status,
        })),
        Doctors: response.data.data.doctors.map((doctor) => ({
          Uuid: doctor.uuid,
          Name: doctor.name,
        })),
        Services: response.data.data.services.map((service) => ({
          Uuid: service.uuid,
          Name: service.name,
          Price: service.price,
        })),
        TimeWorkings: response.data.data.timeWorkings.map((working) => ({
          Uuid: working.uuid,
          DayOfWeek: working.dayOfWeek,
          StartTime: working.startTime,
          EndTime: working.endTime,
        })),
      },
    };
  }

  async getAll(
    hospitalUuid: Guid,
    query: BranchAppointmentQuery = {},
    signal?: AbortSignal,
  ): Promise<ApiResponse<PaginatedData<BranchAppointment>>> {
    const response = await httpClient.get<AppointmentListResponse>(
      this.endpoint(hospitalUuid),
      { params: query, signal },
    );
    return {
      Message: response.data.message,
      Data: {
        Items: response.data.data.map(toAppointment),
        Page: response.data.pagination.page,
        PageSize: response.data.pagination.pageSize,
        TotalItems: response.data.pagination.totalCount,
        TotalPages: response.data.pagination.totalPages,
      },
    };
  }

  async updateStatus(
    hospitalUuid: Guid,
    uuid: Guid,
    status:
      | AppointmentStatus.Approved
      | AppointmentStatus.Unconfirmed
      | AppointmentStatus.CheckedIn
      | AppointmentStatus.Cancelled,
  ) {
    return this.update(hospitalUuid, uuid, "status", { status });
  }

  async assign(
    hospitalUuid: Guid,
    uuid: Guid,
    assignment: { doctorUuid: Guid | null; roomUuid: Guid | null },
  ) {
    return this.update(hospitalUuid, uuid, "assignment", assignment);
  }

  async updatePayment(hospitalUuid: Guid, uuid: Guid, isPaid: boolean) {
    return this.update(hospitalUuid, uuid, "payment", { isPaid });
  }

  async updateNote(hospitalUuid: Guid, uuid: Guid, doctorNote: string) {
    return this.update(hospitalUuid, uuid, "note", { doctorNote });
  }

  async addService(
    hospitalUuid: Guid,
    uuid: Guid,
    medicalServiceUuid: Guid,
    description: string,
  ) {
    const response = await httpClient.post<AppointmentResponse>(
      `${this.endpoint(hospitalUuid)}/${encodeURIComponent(uuid)}/services`,
      { medicalServiceUuid, description },
    );
    return { Message: response.data.message, Data: toAppointment(response.data.data) };
  }

  async completeService(hospitalUuid: Guid, uuid: Guid, serviceUuid: Guid) {
    return this.update(
      hospitalUuid,
      uuid,
      `services/${encodeURIComponent(serviceUuid)}/complete`,
      {},
      "put",
    );
  }

  async complete(hospitalUuid: Guid, uuid: Guid, doctorNote: string) {
    return this.update(hospitalUuid, uuid, "complete", { doctorNote });
  }

  private async update(
    hospitalUuid: Guid,
    uuid: Guid,
    action: string,
    body: object,
    method: "put" | "post" = "put",
  ) {
    const url = `${this.endpoint(hospitalUuid)}/${encodeURIComponent(uuid)}/${action}`;
    const response =
      method === "post"
        ? await httpClient.post<AppointmentResponse>(url, body)
        : await httpClient.put<AppointmentResponse>(url, body);
    return { Message: response.data.message, Data: toAppointment(response.data.data) };
  }
}

function toAppointment(item: ApiAppointment): BranchAppointment {
  return {
    Uuid: item.uuid,
    PatientName: item.patientName,
    Gender: item.gender,
    MedicalCode: item.medicalCode,
    Note: item.note,
    AppointmentDate: new Date(item.appointmentDate),
    TimeSlot: item.timeSlot,
    Time: item.time,
    Type: item.type,
    Status: item.status,
    PatientUuid: item.patientUuid,
    HospitalUuid: item.hospitalUuid ?? "",
    DoctorUuid: item.doctorUuid,
    DoctorName: item.doctorName,
    MedicalServiceUuid: item.medicalServiceUuid,
    MedicalServiceName: item.medicalServiceName,
    RoomUuid: item.roomUuid,
    RoomName: item.roomName,
    DoctorNote: item.doctorNote,
    TotalPrice: item.totalPrice,
    IsPaid: item.isPaid,
    IsWalkIn: item.isWalkIn,
    CreatedAt: new Date(item.createdAt),
    UpdatedAt: new Date(item.updatedAt),
    Services: item.services.map((service) => ({
      Uuid: service.uuid,
      MedicalServiceUuid: service.medicalServiceUuid,
      Name: service.name,
      Price: service.price,
      Description: service.description,
      Status: service.status,
    })),
  };
}

export const branchAppointmentService = new BranchAppointmentService();
