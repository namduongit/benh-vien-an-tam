import type AxiosMockAdapter from "axios-mock-adapter";

import { mockAppointmentMedicalServices } from "@/data/mocks/appointment-medical-services";
import { mockAppointments } from "@/data/mocks/appointments";
import { mockAccounts } from "@/data/mocks/accounts";
import { mockDoctorWorkings } from "@/data/mocks/doctor-workings";
import { mockDoctors } from "@/data/mocks/doctors";
import { mockHospitalMedicalServices } from "@/data/mocks/hospital-medical-services";
import { mockHospitals } from "@/data/mocks/hospitals";
import { mockMedicalServices } from "@/data/mocks/medical-services";
import { mockRooms } from "@/data/mocks/rooms";
import { mockTimeWorkings } from "@/data/mocks/time-workings";
import { getPositiveIntegerParam, getStringParam } from "@/lib/mocks/query-utils";
import {
  AppointmentMedicalServiceStatus,
  AppointmentStatus,
  AppointmentType,
  BaseStatus,
  RoomStatus,
  type Appointment,
  type AppointmentMedicalService,
} from "@/types/models";

type Payload = Record<string, unknown>;

const appointments = mockAppointments.map((item) => ({
  ...item,
  AppointmentDate: new Date(item.AppointmentDate.getTime()),
  StartTime: new Date(item.StartTime.getTime()),
  CreatedAt: new Date(item.CreatedAt.getTime()),
  UpdatedAt: new Date(item.UpdatedAt.getTime()),
  DeletedAt: new Date(item.DeletedAt.getTime()),
}));
const appointmentServices: AppointmentMedicalService[] =
  mockAppointmentMedicalServices.map((item) => ({ ...item }));
const rooms = mockRooms.map((item) => ({ ...item }));

export function registerBranchAppointmentRoutes(mock: AxiosMockAdapter) {
  mock.onGet(/^\/hospitals\/[^/]+\/appointments\/resources$/).reply((config) => {
    const hospitalUuid = getHospitalUuid(config.url);
    if (!hospitalExists(hospitalUuid)) return notFound();
    return [
      200,
      {
        message: "Fetched successfully",
        data: {
          rooms: rooms.filter((item) =>
            item.HospitalUuid === hospitalUuid &&
            item.DeletedAt.getTime() === 0 &&
            item.Status === RoomStatus.Available)
            .map((room) => ({
              uuid: room.Uuid,
              name: room.Name,
              status: room.Status,
            })),
          doctors: mockDoctors
            .filter((doctor) =>
              doctor.HospitalUuid === hospitalUuid &&
              mockAccountsActive(hospitalUuid, doctor.AccountUuid))
            .map((doctor) => ({ uuid: doctor.Uuid, name: doctor.Name })),
          services: mockMedicalServices
            .filter((service) =>
              service.Status === BaseStatus.Active &&
              mockHospitalMedicalServices.some((relation) =>
                relation.HospitalUuid === hospitalUuid &&
                relation.MedicalServiceUuid === service.Uuid))
            .map((service) => ({
              uuid: service.Uuid,
              name: service.Name,
              price: service.Price,
            })),
          timeWorkings: mockTimeWorkings
            .filter((working) =>
              working.Status === BaseStatus.Active &&
              working.DeletedAt.getTime() === 0)
            .map((working) => ({
              uuid: working.Uuid,
              dayOfWeek: working.DayOfWeek,
              startTime: working.StartTime,
              endTime: working.EndTime,
            })),
        },
      },
    ];
  });

  mock.onGet(/^\/hospitals\/[^/]+\/appointments$/).reply((config) => {
    const hospitalUuid = getHospitalUuid(config.url);
    if (!hospitalExists(hospitalUuid)) return notFound();

    const from = getStringParam(config.params, "from");
    const to = getStringParam(config.params, "to");
    const status = getStringParam(config.params, "status");
    const type = getStringParam(config.params, "type");
    const search = getStringParam(config.params, "search").toLocaleLowerCase("vi");
    if (status && !Object.values(AppointmentStatus).includes(status as AppointmentStatus)) {
      return [400, { message: "Appointment status is invalid" }];
    }
    if (type && !Object.values(AppointmentType).includes(type as AppointmentType)) {
      return [400, { message: "Appointment type is invalid" }];
    }

    const page = getPositiveIntegerParam(config.params, "page", 1);
    const pageSize = Math.min(getPositiveIntegerParam(config.params, "pageSize", 100), 100);
    const filtered = appointments
      .filter((item) =>
        item.HospitalUuid === hospitalUuid &&
        item.DeletedAt.getTime() === 0 &&
        (!from || item.AppointmentDate >= parseDate(from)) &&
        (!to || item.AppointmentDate < addDays(parseDate(to), 1)) &&
        (!status || item.Status === status) &&
        (!type || item.Type === type))
      .map(toDto)
      .filter((item) =>
        !search ||
        `${item.patientName} ${item.medicalCode} ${item.doctorName ?? ""} ${item.roomName ?? ""}`
          .toLocaleLowerCase("vi")
          .includes(search))
      .sort((left, right) =>
        new Date(left.appointmentDate).getTime() - new Date(right.appointmentDate).getTime() ||
        left.time.localeCompare(right.time));
    const totalCount = filtered.length;
    return [
      200,
      {
        message: "Fetched successfully",
        data: filtered.slice((page - 1) * pageSize, page * pageSize),
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
        },
      },
    ];
  });

  mock.onPut(/^\/hospitals\/[^/]+\/appointments\/[^/]+\/status$/).reply((config) => {
    const [hospitalUuid, appointmentUuid] = getRouteIds(config.url);
    const appointment = findAppointment(hospitalUuid, appointmentUuid);
    if (!appointment) return notFound("Appointment not found");
    const payload = parsePayload(config.data);
    const nextStatus = payload.status;
    if (
      nextStatus !== AppointmentStatus.Approved &&
      nextStatus !== AppointmentStatus.Unconfirmed &&
      nextStatus !== AppointmentStatus.CheckedIn &&
      nextStatus !== AppointmentStatus.Cancelled
    ) {
      return badRequest("Requested appointment status is not supported");
    }
    const validTransition =
      (appointment.Status === AppointmentStatus.Pending &&
        (nextStatus === AppointmentStatus.Approved ||
          nextStatus === AppointmentStatus.Unconfirmed ||
          nextStatus === AppointmentStatus.Cancelled)) ||
      (appointment.Status === AppointmentStatus.Approved &&
        (nextStatus === AppointmentStatus.CheckedIn ||
          nextStatus === AppointmentStatus.Cancelled));
    if (!validTransition) {
      return conflict("Appointment status transition is not allowed", "INVALID_APPOINTMENT_STATE");
    }
    appointment.Status = nextStatus;
    appointment.UpdatedAt = new Date();
    return success(appointment);
  });

  mock.onPut(/^\/hospitals\/[^/]+\/appointments\/[^/]+\/assignment$/).reply((config) => {
    const [hospitalUuid, appointmentUuid] = getRouteIds(config.url);
    const appointment = findAppointment(hospitalUuid, appointmentUuid);
    if (!appointment) return notFound("Appointment not found");
    if (appointment.Status !== AppointmentStatus.Pending && appointment.Status !== AppointmentStatus.Approved) {
      return conflict("Only pending or approved appointments can be assigned", "INVALID_APPOINTMENT_STATE");
    }
    const payload = parsePayload(config.data);
    const doctorUuid = typeof payload.doctorUuid === "string" ? payload.doctorUuid : null;
    const roomUuid = typeof payload.roomUuid === "string" ? payload.roomUuid : null;

    if (doctorUuid) {
      const doctor = mockDoctors.find((item) =>
        item.Uuid === doctorUuid && item.HospitalUuid === hospitalUuid &&
        mockAccountsActive(hospitalUuid, item.AccountUuid));
      if (!doctor) return badRequest("Doctor does not belong to this branch or is inactive", "DOCTOR_NOT_AVAILABLE");
      const working = mockTimeWorkings.find((item) =>
        item.Uuid === appointment.TimeSlot &&
        item.Status === BaseStatus.Active &&
        item.DayOfWeek === appointment.AppointmentDate.getDay());
      if (!working || !mockDoctorWorkings.some((item) =>
        item.DoctorUuid === doctorUuid && item.WorkingUuid === working.Uuid)) {
        return conflict("Doctor is not scheduled for this time slot", "DOCTOR_NOT_SCHEDULED");
      }
      if (appointments.some((item) =>
        item.Uuid !== appointment.Uuid && item.HospitalUuid === hospitalUuid &&
        item.DoctorUuid === doctorUuid && sameSlot(item, appointment) &&
        isActiveAppointment(item.Status) &&
        item.DeletedAt.getTime() === 0)) {
        return conflict("Doctor already has an appointment for this time slot", "DOCTOR_SLOT_TAKEN");
      }
    }

    if (roomUuid) {
      const room = rooms.find((item) =>
        item.Uuid === roomUuid && item.HospitalUuid === hospitalUuid &&
        item.DeletedAt.getTime() === 0 && item.Status === RoomStatus.Available);
      if (!room) return badRequest("Room is not available in this branch", "ROOM_NOT_AVAILABLE");
      if (appointments.some((item) =>
        item.Uuid !== appointment.Uuid && item.HospitalUuid === hospitalUuid &&
        item.RoomUuid === roomUuid && sameSlot(item, appointment) &&
        isActiveAppointment(item.Status) &&
        item.DeletedAt.getTime() === 0)) {
        return conflict("Room already has an appointment for this time slot", "ROOM_SLOT_TAKEN");
      }
    }
    appointment.DoctorUuid = doctorUuid;
    appointment.RoomUuid = roomUuid;
    appointment.UpdatedAt = new Date();
    return success(appointment, "Resources assigned successfully");
  });

  mock.onPut(/^\/hospitals\/[^/]+\/appointments\/[^/]+\/payment$/).reply((config) => {
    const [hospitalUuid, uuid] = getRouteIds(config.url);
    const appointment = findAppointment(hospitalUuid, uuid);
    if (!appointment) return notFound("Appointment not found");
    if (appointment.Status !== AppointmentStatus.Approved && appointment.Status !== AppointmentStatus.CheckedIn) {
      return conflict("Payment can only be updated for approved or checked-in appointments", "INVALID_APPOINTMENT_STATE");
    }
    const payload = parsePayload(config.data);
    if (typeof payload.isPaid !== "boolean") return badRequest("Payment status is invalid");
    appointment.IsPaid = payload.isPaid;
    appointment.UpdatedAt = new Date();
    return success(appointment, "Payment updated successfully");
  });

  mock.onPut(/^\/hospitals\/[^/]+\/appointments\/[^/]+\/note$/).reply((config) => {
    const [hospitalUuid, uuid] = getRouteIds(config.url);
    const appointment = findAppointment(hospitalUuid, uuid);
    if (!appointment) return notFound("Appointment not found");
    if (appointment.Status === AppointmentStatus.Done || appointment.Status === AppointmentStatus.Cancelled ||
        appointment.Status === AppointmentStatus.Unconfirmed) {
      return conflict("Notes cannot be changed for a completed or cancelled appointment", "INVALID_APPOINTMENT_STATE");
    }
    const payload = parsePayload(config.data);
    if (typeof payload.doctorNote !== "string") return badRequest("Doctor note is invalid");
    appointment.DoctorNote = payload.doctorNote.trim();
    appointment.UpdatedAt = new Date();
    return success(appointment, "Doctor note updated successfully");
  });

  mock.onPost(/^\/hospitals\/[^/]+\/appointments\/[^/]+\/services$/).reply((config) => {
    const [hospitalUuid, uuid] = getRouteIds(config.url);
    const appointment = findAppointment(hospitalUuid, uuid);
    if (!appointment) return notFound("Appointment not found");
    if (appointment.Status !== AppointmentStatus.Approved && appointment.Status !== AppointmentStatus.CheckedIn) {
      return conflict("Services can only be added to approved or checked-in appointments", "INVALID_APPOINTMENT_STATE");
    }
    const payload = parsePayload(config.data);
    const medicalServiceUuid = typeof payload.medicalServiceUuid === "string" ? payload.medicalServiceUuid : "";
    const service = mockMedicalServices.find((item) =>
      item.Uuid === medicalServiceUuid &&
      item.Status === BaseStatus.Active &&
      mockHospitalMedicalServices.some((relation) =>
        relation.HospitalUuid === hospitalUuid && relation.MedicalServiceUuid === item.Uuid));
    if (!service) return badRequest("Service is not available in this branch", "SERVICE_NOT_AVAILABLE");

    const detail: AppointmentMedicalService = {
      Uuid: crypto.randomUUID(),
      AppointmentUuid: appointment.Uuid,
      MedicalServiceUuid: service.Uuid,
      Price: service.Price,
      Description: typeof payload.description === "string" ? payload.description.trim() : "",
      Status: AppointmentMedicalServiceStatus.InProgress,
    };
    appointmentServices.push(detail);
    appointment.TotalPrice += detail.Price;
    appointment.UpdatedAt = new Date();
    return success(appointment, "Service added successfully");
  });

  mock.onPut(/^\/hospitals\/[^/]+\/appointments\/[^/]+\/services\/[^/]+\/complete$/).reply((config) => {
    const [hospitalUuid, uuid, detailUuid] = getRouteIds(config.url, true);
    const appointment = findAppointment(hospitalUuid, uuid);
    if (!appointment) return notFound("Appointment not found");
    if (appointment.Status !== AppointmentStatus.Approved && appointment.Status !== AppointmentStatus.CheckedIn) {
      return conflict("Services can only be completed for approved or checked-in appointments", "INVALID_APPOINTMENT_STATE");
    }
    const detail = appointmentServices.find((item) =>
      item.Uuid === detailUuid && item.AppointmentUuid === appointment.Uuid);
    if (!detail) return notFound("Appointment service not found");
    detail.Status = AppointmentMedicalServiceStatus.Completed;
    appointment.UpdatedAt = new Date();
    return success(appointment, "Service completed successfully");
  });

  mock.onPut(/^\/hospitals\/[^/]+\/appointments\/[^/]+\/complete$/).reply((config) => {
    const [hospitalUuid, uuid] = getRouteIds(config.url);
    const appointment = findAppointment(hospitalUuid, uuid);
    if (!appointment) return notFound("Appointment not found");
    if (appointment.Status !== AppointmentStatus.CheckedIn) {
      return conflict("Only checked-in appointments can be completed", "INVALID_APPOINTMENT_STATE");
    }
    if (!appointment.IsPaid) return conflict("Appointment must be paid before completion", "PAYMENT_REQUIRED");
    if (appointmentServices.some((item) =>
      item.AppointmentUuid === uuid && item.Status !== AppointmentMedicalServiceStatus.Completed)) {
      return conflict("All additional services must be completed first", "SERVICES_INCOMPLETE");
    }
    const payload = parsePayload(config.data);
    if (typeof payload.doctorNote !== "string") return badRequest("Doctor note is invalid");
    appointment.Status = AppointmentStatus.Done;
    appointment.DoctorNote = payload.doctorNote.trim();
    appointment.UpdatedAt = new Date();
    if (appointment.RoomUuid && !appointments.some((item) =>
      item.Uuid !== appointment.Uuid &&
      item.HospitalUuid === hospitalUuid &&
      item.RoomUuid === appointment.RoomUuid &&
      item.DeletedAt.getTime() === 0 &&
      isActiveAppointment(item.Status))) {
      const room = rooms.find((item) => item.Uuid === appointment.RoomUuid);
      if (room?.Status === RoomStatus.Occupied) room.Status = RoomStatus.Available;
    }
    return success(appointment, "Appointment completed successfully");
  });
}

function toDto(appointment: Appointment) {
  const working = mockTimeWorkings.find((item) => item.Uuid === appointment.TimeSlot);
  const doctor = mockDoctors.find((item) => item.Uuid === appointment.DoctorUuid);
  const room = rooms.find((item) => item.Uuid === appointment.RoomUuid);
  const service = mockMedicalServices.find((item) => item.Uuid === appointment.MedicalServiceUuid);
  return {
    uuid: appointment.Uuid,
    patientName: appointment.PatientName,
    gender: appointment.Gender,
    medicalCode: appointment.MedicalCode,
    note: appointment.Note,
    appointmentDate: appointment.AppointmentDate.toISOString(),
    timeSlot: appointment.TimeSlot,
    time: working ? `${working.StartTime} - ${working.EndTime}` : appointment.StartTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    type: appointment.Type,
    status: appointment.Status,
    patientUuid: appointment.PatientUuid,
    hospitalUuid: appointment.HospitalUuid,
    doctorUuid: appointment.DoctorUuid,
    doctorName: doctor?.Name ?? null,
    medicalServiceUuid: appointment.MedicalServiceUuid,
    medicalServiceName: service?.Name ?? null,
    roomUuid: appointment.RoomUuid,
    roomName: room?.Name ?? null,
    doctorNote: appointment.DoctorNote,
    totalPrice: appointment.TotalPrice,
    isPaid: appointment.IsPaid,
    isWalkIn: appointment.IsWalkIn,
    createdAt: appointment.CreatedAt.toISOString(),
    updatedAt: appointment.UpdatedAt.toISOString(),
    services: appointmentServices
      .filter((item) => item.AppointmentUuid === appointment.Uuid)
      .map((item) => ({
        uuid: item.Uuid,
        medicalServiceUuid: item.MedicalServiceUuid,
        name: mockMedicalServices.find((serviceItem) =>
          serviceItem.Uuid === item.MedicalServiceUuid)?.Name ?? "Dịch vụ",
        price: item.Price,
        description: item.Description,
        status: item.Status,
      })),
  };
}

function findAppointment(hospitalUuid: string, uuid: string) {
  if (!hospitalExists(hospitalUuid)) return undefined;
  return appointments.find((item) =>
    item.Uuid === uuid && item.HospitalUuid === hospitalUuid && item.DeletedAt.getTime() === 0);
}

function mockAccountsActive(hospitalUuid: string, accountUuid: string) {
  return mockAccounts.some((account) =>
    account.Uuid === accountUuid &&
    account.HospitalUuid === hospitalUuid &&
    account.Status === BaseStatus.Active &&
    account.DeletedAt.getTime() === 0);
}

function sameSlot(left: Appointment, right: Appointment) {
  return left.AppointmentDate.getTime() === right.AppointmentDate.getTime() &&
    left.TimeSlot === right.TimeSlot;
}

function isActiveAppointment(status: AppointmentStatus) {
  return status === AppointmentStatus.Pending ||
    status === AppointmentStatus.Approved ||
    status === AppointmentStatus.CheckedIn;
}

function hospitalExists(uuid: string) {
  return mockHospitals.some((item) =>
    item.Uuid === uuid && item.DeletedAt.getTime() === 0);
}

function getHospitalUuid(url?: string) {
  return decodeURIComponent(url?.split("/")[2] ?? "");
}

function getRouteIds(url?: string, serviceRoute = false) {
  const parts = url?.split("/") ?? [];
  return [
    decodeURIComponent(parts[2] ?? ""),
    decodeURIComponent(parts[4] ?? ""),
    serviceRoute ? decodeURIComponent(parts[6] ?? "") : "",
  ];
}

function parsePayload(data: unknown): Payload {
  if (typeof data === "string") {
    try {
      const parsed: unknown = JSON.parse(data);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed as Payload
        : {};
    } catch {
      return {};
    }
  }
  return data && typeof data === "object" && !Array.isArray(data)
    ? data as Payload
    : {};
}

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function success(appointment: Appointment, message = "Updated successfully") {
  return [200, { message, data: toDto(appointment) }] as [number, unknown];
}

function badRequest(message: string, error?: string) {
  return [400, { message, ...(error ? { error } : {}) }] as [number, unknown];
}

function conflict(message: string, error: string) {
  return [409, { message, error }] as [number, unknown];
}

function notFound(message = "Hospital not found") {
  return [404, { message, error: "Resource does not exist" }] as [number, unknown];
}
