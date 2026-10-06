import type AxiosMockAdapter from "axios-mock-adapter";

import { mockAccounts } from "@/data/mocks/accounts";
import { mockAppointments } from "@/data/mocks/appointments";
import { mockDoctors } from "@/data/mocks/doctors";
import { mockHospitalMedicalServices } from "@/data/mocks/hospital-medical-services";
import { mockHospitals } from "@/data/mocks/hospitals";
import { mockMedicalServices } from "@/data/mocks/medical-services";
import { mockPatientProfiles } from "@/data/mocks/patient-profiles";
import { mockRooms } from "@/data/mocks/rooms";
import { mockTimeWorkings } from "@/data/mocks/time-workings";
import {
  createSlotTimes,
  formatWorkingTime,
  getVietnamDateTimeParts,
  getVietnamToday,
  intersectWorkingHours,
  isValidDateString,
  parseWorkingHours,
  toAppointmentIso,
  type ParsedWorkingHours,
} from "@/lib/booking/working-hours";
import { getStringParam } from "@/lib/mocks/query-utils";
import type {
  Appointment as AppointmentView,
  AppointmentPresentation,
  BookingType,
  CancelAppointmentRequest,
  CreateAppointmentRequest,
  CreateWalkInAppointmentRequest,
  RescheduleAppointmentRequest,
} from "@/types/appointments";
import {
  AppointmentStatus,
  AppointmentType,
  BaseStatus,
  Gender,
  ROLE_UUIDS,
  RoomStatus,
  type Appointment,
  type DoctorProfile,
  type Hospital,
  type MedicalService,
} from "@/types/models";

const rescheduledAppointmentUuids = new Set<string>();

function resolveWorkingSlot(appointmentAt: Date) {
  const parts = getVietnamDateTimeParts(appointmentAt);
  const dayOfWeek = new Date(`${parts.Date}T12:00:00+07:00`).getDay();
  const slot = mockTimeWorkings.find(
    (working) => working.DayOfWeek === dayOfWeek && working.StartTime <= parts.Time && working.EndTime >= parts.Time,
  );

  return {
    AppointmentDate: new Date(`${parts.Date}T00:00:00+07:00`),
    TimeSlot: slot?.Uuid ?? mockTimeWorkings[0].Uuid,
  };
}

type ResolvedBooking = {
  Type: BookingType;
  Hospital: Hospital;
  Doctor?: DoctorProfile;
  MedicalService?: MedicalService;
  WorkingHours: ParsedWorkingHours;
};

export function registerAppointmentRoutes(mock: AxiosMockAdapter) {
  mock.onGet("/appointments/booking-context").reply(200, {
    Data: getBookingContext(),
    Message: "Lấy thông tin đặt lịch thành công.",
  });

  mock.onGet("/appointments").reply((config): [number, unknown] => {
    const accountUuid = getStringParam(config.params, "accountUuid");
    const authenticatedAccountUuid = getAuthenticatedAccountUuid(config.headers);
    if (!authenticatedAccountUuid || accountUuid !== authenticatedAccountUuid) {
      return unauthorizedResponse();
    }

    const status = getStringParam(config.params, "status");
    const type = getStringParam(config.params, "type");
    const from = getStringParam(config.params, "from");
    const to = getStringParam(config.params, "to");
    if (
      (status && !Object.values(AppointmentStatus).includes(status as AppointmentStatus)) ||
      (type && !isBookingType(type)) ||
      (from && !isValidDateString(from)) ||
      (to && !isValidDateString(to)) ||
      (from && to && from > to)
    ) {
      return [422, errorBody("INVALID_FILTER", "Bộ lọc lịch hẹn không hợp lệ.")];
    }

    const page = parsePositiveInteger(config.params?.page, 1);
    const pageSize = Math.min(parsePositiveInteger(config.params?.pageSize, 5), 20);
    const items = getAppointmentPresentations(accountUuid)
      .filter((item) => !status || item.Appointment.Status === status)
      .filter((item) => !type || item.Type === type)
      .filter((item) => {
        const date = getVietnamDateTimeParts(item.Appointment.AppointmentAt).Date;
        return (!from || date >= from) && (!to || date <= to);
      })
      .sort(
        (left, right) =>
          right.Appointment.AppointmentAt.getTime() -
          left.Appointment.AppointmentAt.getTime(),
      );
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;

    return [
      200,
      {
        Data: {
          Items: items.slice(start, start + pageSize),
          Page: safePage,
          PageSize: pageSize,
          TotalItems: items.length,
          TotalPages: totalPages,
        },
        Message: "Lấy danh sách lịch hẹn thành công.",
      },
    ];
  });

  mock.onGet("/appointments/availability").reply((config): [number, unknown] => {
    const type = getStringParam(config.params, "type") as BookingType;
    const targetUuid = getStringParam(config.params, "targetUuid");
    const hospitalUuid = getStringParam(config.params, "hospitalUuid");
    const accountUuid = getStringParam(config.params, "accountUuid");
    const authenticatedAccountUuid = getAuthenticatedAccountUuid(config.headers);
    const date = getStringParam(config.params, "date");
    const resolved = resolveBooking(type, targetUuid, hospitalUuid);
    const patient = getPatientByAccountUuid(accountUuid);

    if (!resolved) return invalidBranchResponse();
    if (
      !authenticatedAccountUuid ||
      accountUuid !== authenticatedAccountUuid ||
      !patient
    ) {
      return unauthorizedResponse();
    }
    if (!isValidDateString(date) || date < getVietnamToday()) {
      return [422, errorBody("INVALID_DATE", "Ngày khám không hợp lệ.")];
    }

    const slots = createSlotTimes(date, resolved.WorkingHours).map((time) => {
      const appointmentAt = new Date(toAppointmentIso(date, time));
      return {
        AppointmentAt: appointmentAt.toISOString(),
        Time: time,
        IsAvailable:
          appointmentAt.getTime() > Date.now() &&
          canBook(resolved, appointmentAt, patient.Uuid),
      };
    });

    return [
      200,
      {
        Data: {
          Date: date,
          WorkingHour: formatWorkingTime(resolved.WorkingHours),
          Slots: slots,
        },
        Message: "Lấy thời gian khả dụng thành công.",
      },
    ];
  });

  mock
    .onPost(/^\/appointments\/(hospitals|doctors|medical-services)$/)
    .reply((config): [number, unknown] => {
      const path = config.url?.split("/").pop();
      const type: BookingType =
        path === "hospitals"
          ? "hospital"
          : path === "doctors"
            ? "doctor"
            : "medical-service";
      const request = {
        ...parseBody<Omit<CreateAppointmentRequest, "Type">>(config.data),
        Type: type,
      } as CreateAppointmentRequest;
      const authenticatedAccountUuid = getAuthenticatedAccountUuid(config.headers);
      if (
        !authenticatedAccountUuid ||
        request.AccountUuid !== authenticatedAccountUuid
      ) {
        return unauthorizedResponse();
      }
      const targetUuid =
        request.Type === "hospital"
          ? request.HospitalUuid
          : request.Type === "doctor"
            ? request.DoctorUuid
            : request.MedicalServiceUuid;
      const resolved = resolveBooking(
        request.Type,
        targetUuid,
        request.HospitalUuid,
      );
      if (!resolved) return invalidBranchResponse();

      const identityError = validatePatient(request);
      if (identityError) return identityError;
      const patient = getPatientByAccountUuid(request.AccountUuid);
      if (!patient) return unauthorizedResponse();

      const appointmentAt = new Date(request.AppointmentAt);
      if (
        Number.isNaN(appointmentAt.getTime()) ||
        appointmentAt.getTime() <= Date.now()
      ) {
        return [
          422,
          errorBody("INVALID_DATE", "Thời gian khám phải ở tương lai."),
        ];
      }

      const parts = getVietnamDateTimeParts(appointmentAt);
      if (
        !createSlotTimes(parts.Date, resolved.WorkingHours).includes(parts.Time)
      ) {
        return [
          422,
          errorBody(
            "OUTSIDE_WORKING_HOURS",
            "Thời gian nằm ngoài giờ làm việc.",
          ),
        ];
      }
      if (!canBook(resolved, appointmentAt, patient.Uuid)) {
        return [
          409,
          errorBody(
            "SLOT_CONFLICT",
            "Thời gian này vừa không còn khả dụng. Vui lòng chọn thời gian khác.",
          ),
        ];
      }

      const now = new Date();
      const common = {
        Uuid: crypto.randomUUID(),
        PatientName: request.PatientName.trim(),
        Gender: request.Gender as Gender,
        Note: request.Note.trim(),
        MedicalCode: request.MedicalCode,
        StartTime: appointmentAt,
        ...resolveWorkingSlot(appointmentAt),
        Status: AppointmentStatus.Pending,
        PatientUuid: patient.Uuid,
        HospitalUuid: resolved.Hospital.Uuid,
        RoomUuid: null,
        DoctorNote: "",
        TotalPrice: resolved.Doctor?.Price ?? resolved.MedicalService?.Price ?? 0,
        IsPaid: false,
        IsWalkIn: false,
        GuestPhone: null,
        CreatedAt: now,
        UpdatedAt: now,
        DeletedAt: new Date(0),
      };
      const appointment: Appointment =
        request.Type === "doctor"
          ? {
              ...common,
              Type: AppointmentType.Doctor,
              DoctorUuid: request.DoctorUuid,
              MedicalServiceUuid: null,
            }
          : request.Type === "medical-service"
            ? {
                ...common,
                Type: AppointmentType.Service,
                DoctorUuid: null,
                MedicalServiceUuid: request.MedicalServiceUuid,
              }
            : {
                ...common,
                Type: AppointmentType.Hospital,
                DoctorUuid: null,
                MedicalServiceUuid: null,
              };
      mockAppointments.push(appointment);
      const appointmentView = toAppointmentView(appointment);
      return appointmentView
        ? createdResponse(appointmentView)
        : notFoundResponse();
    });

  mock
    .onGet(/^\/appointments\/[^/]+\/detail$/)
    .reply((config): [number, unknown] => {
      const uuid = decodeURIComponent(config.url?.split("/").at(-2) ?? "");
      const accountUuid = getStringParam(config.params, "accountUuid");
      const authenticatedAccountUuid = getAuthenticatedAccountUuid(config.headers);
      if (!authenticatedAccountUuid || accountUuid !== authenticatedAccountUuid) {
        return unauthorizedResponse();
      }
      const item = getAppointmentPresentation(uuid, accountUuid);
      return item
        ? [200, { Data: item, Message: "Lấy chi tiết lịch hẹn thành công." }]
        : notFoundResponse();
    });

  mock
    .onPost(/^\/appointments\/[^/]+\/reschedule$/)
    .reply((config): [number, unknown] => {
      const uuid = decodeURIComponent(config.url?.split("/").at(-2) ?? "");
      const request = parseBody<RescheduleAppointmentRequest>(config.data);
      const owned = getOwnedAppointment(config.headers, request.AccountUuid, uuid);
      if (!owned) return unauthorizedResponse();
      const editableError = validateEditable(owned.Appointment);
      if (editableError) return editableError;
      if (rescheduledAppointmentUuids.has(uuid)) {
        return [
          409,
          errorBody("RESCHEDULE_LIMIT", "Lịch hẹn này đã được đổi một lần."),
        ];
      }

      const appointmentAt = new Date(request.AppointmentAt);
      if (
        Number.isNaN(appointmentAt.getTime()) ||
        appointmentAt.getTime() - Date.now() < 24 * 60 * 60 * 1000
      ) {
        return [
          422,
          errorBody("INVALID_DATE", "Thời gian mới phải cách hiện tại ít nhất 24 giờ."),
        ];
      }
      const resolved = resolveExistingBooking(owned);
      if (!resolved) return invalidBranchResponse();
      const parts = getVietnamDateTimeParts(appointmentAt);
      if (!createSlotTimes(parts.Date, resolved.WorkingHours).includes(parts.Time)) {
        return [
          422,
          errorBody("OUTSIDE_WORKING_HOURS", "Thời gian nằm ngoài giờ làm việc."),
        ];
      }
      if (!canBook(resolved, appointmentAt, owned.Appointment.PatientUuid, uuid)) {
        return [
          409,
          errorBody("SLOT_CONFLICT", "Thời gian này vừa không còn khả dụng."),
        ];
      }
      owned.Appointment.StartTime = appointmentAt;
      Object.assign(owned.Appointment, resolveWorkingSlot(appointmentAt));
      owned.Appointment.RoomUuid = null;
      owned.Appointment.UpdatedAt = new Date();
      rescheduledAppointmentUuids.add(uuid);
      return [
        200,
        {
          Data: buildAppointmentPresentation(owned.Type, owned.Appointment),
          Message: "Đổi lịch hẹn thành công.",
        },
      ];
    });

  mock
    .onPost(/^\/appointments\/[^/]+\/cancel$/)
    .reply((config): [number, unknown] => {
      const uuid = decodeURIComponent(config.url?.split("/").at(-2) ?? "");
      const request = parseBody<CancelAppointmentRequest>(config.data);
      const owned = getOwnedAppointment(config.headers, request.AccountUuid, uuid);
      if (!owned) return unauthorizedResponse();
      const editableError = validateEditable(owned.Appointment);
      if (editableError) return editableError;

      owned.Appointment.Status = AppointmentStatus.Cancelled;
      owned.Appointment.UpdatedAt = new Date();
      return [
        200,
        {
          Data: buildAppointmentPresentation(owned.Type, owned.Appointment),
          Message: "Hủy lịch hẹn thành công.",
        },
      ];
    });

  mock.onGet(/^\/appointments\/[^/]+$/).reply((config): [number, unknown] => {
    const uuid = decodeURIComponent(config.url?.split("/").pop() ?? "");
    const accountUuid = getStringParam(config.params, "accountUuid");
    const authenticatedAccountUuid = getAuthenticatedAccountUuid(config.headers);
    if (!authenticatedAccountUuid || accountUuid !== authenticatedAccountUuid) {
      return unauthorizedResponse();
    }
    const presentation = getAppointmentPresentation(uuid, accountUuid);
    return presentation
      ? confirmationResponse(
          presentation.Type,
          presentation.Appointment,
          presentation.TargetName,
          presentation.HospitalName,
        )
      : notFoundResponse();
  });

  // ==== Tiếp nhận & điều phối - Walk-in (khách vãng lai không cần tài khoản) ====
  //
  // STAFF đăng nhập → tạo lịch hẹn trực tiếp cho người đến quầy mà không yêu cầu
  // tài khoản PATIENT. Lịch này có IsWalkIn=true, PatientUuid=null,
  // GuestPhone là số điện thoại khách cung cấp.

  mock.onGet("/appointments/walk-in/availability").reply((config): [number, unknown] => {
    if (!getAuthenticatedStaffUuid(config.headers)) {
      return unauthorizedResponse();
    }
    const type = getStringParam(config.params, "type") as BookingType;
    const targetUuid = getStringParam(config.params, "targetUuid");
    const hospitalUuid = getStringParam(config.params, "hospitalUuid");
    const date = getStringParam(config.params, "date");
    const resolved = resolveBooking(type, targetUuid, hospitalUuid);
    if (!resolved) return invalidBranchResponse();
    if (!isValidDateString(date) || date < getVietnamToday()) {
      return [422, errorBody("INVALID_DATE", "Ngày khám không hợp lệ.")];
    }

    const slots = createSlotTimes(date, resolved.WorkingHours).map((time) => {
      const appointmentAt = new Date(toAppointmentIso(date, time));
      return {
        AppointmentAt: appointmentAt.toISOString(),
        Time: time,
        IsAvailable:
          appointmentAt.getTime() > Date.now() &&
          hasHospitalCapacity(resolved.Hospital.Uuid, appointmentAt.getTime()),
      };
    });

    return [
      200,
      {
        Data: {
          Date: date,
          WorkingHour: formatWorkingTime(resolved.WorkingHours),
          Slots: slots,
        },
        Message: "Lấy thời gian khả dụng cho khách vãng lai thành công.",
      },
    ];
  });

  mock.onPost("/appointments/walk-in").reply((config): [number, unknown] => {
    if (!getAuthenticatedStaffUuid(config.headers)) {
      return unauthorizedResponse();
    }
    const request = parseBody<CreateWalkInAppointmentRequest>(config.data);
    const guestError = validateWalkInGuest(request);
    if (guestError) return guestError;

    const targetUuid =
      request.Type === "hospital"
        ? request.HospitalUuid
        : request.Type === "doctor"
          ? request.DoctorUuid
          : request.MedicalServiceUuid;
    const resolved = resolveBooking(
      request.Type,
      targetUuid,
      request.HospitalUuid,
    );
    if (!resolved) return invalidBranchResponse();

    const appointmentAt = new Date(request.AppointmentAt);
    if (
      Number.isNaN(appointmentAt.getTime()) ||
      appointmentAt.getTime() <= Date.now()
    ) {
      return [
        422,
        errorBody("INVALID_DATE", "Thời gian khám phải ở tương lai."),
      ];
    }

    const parts = getVietnamDateTimeParts(appointmentAt);
    if (
      !createSlotTimes(parts.Date, resolved.WorkingHours).includes(parts.Time)
    ) {
      return [
        422,
        errorBody("OUTSIDE_WORKING_HOURS", "Thời gian nằm ngoài giờ làm việc."),
      ];
    }
    if (!hasHospitalCapacity(resolved.Hospital.Uuid, appointmentAt.getTime())) {
      return [
        409,
        errorBody(
          "SLOT_CONFLICT",
          "Thời gian này vừa không còn khả dụng. Vui lòng chọn thời gian khác.",
        ),
      ];
    }

    const now = new Date();
    const common = {
      Uuid: crypto.randomUUID(),
      PatientName: request.PatientName.trim(),
      Gender: request.Gender as Gender,
      Note: request.Note.trim(),
      MedicalCode: request.MedicalCode,
      StartTime: appointmentAt,
      ...resolveWorkingSlot(appointmentAt),
      Status: AppointmentStatus.Pending,
      PatientUuid: null, // walk-in: không gắn với tài khoản người bệnh
      HospitalUuid: resolved.Hospital.Uuid,
      RoomUuid: null,
      DoctorNote: "",
      TotalPrice: resolved.Doctor?.Price ?? resolved.MedicalService?.Price ?? 0,
      IsPaid: false,
      IsWalkIn: true,
      GuestPhone: request.Phone.replace(/[\s.-]/g, ""),
      CreatedAt: now,
      UpdatedAt: now,
      DeletedAt: new Date(0),
    };
    const appointment: Appointment =
      request.Type === "doctor"
        ? {
            ...common,
            Type: AppointmentType.Doctor,
            DoctorUuid: request.DoctorUuid,
            MedicalServiceUuid: null,
          }
        : request.Type === "medical-service"
          ? {
              ...common,
              Type: AppointmentType.Service,
              DoctorUuid: null,
              MedicalServiceUuid: request.MedicalServiceUuid,
            }
          : {
              ...common,
              Type: AppointmentType.Hospital,
              DoctorUuid: null,
              MedicalServiceUuid: null,
            };
    mockAppointments.push(appointment);
    const appointmentView = toAppointmentView(appointment);
    return appointmentView
      ? createdResponse(appointmentView)
      : notFoundResponse();
  });
}

type OwnedAppointment = { Type: BookingType; Appointment: Appointment };

function getOwnedAppointment(
  headers: unknown,
  accountUuid: string,
  uuid: string,
): OwnedAppointment | null {
  const authenticatedAccountUuid = getAuthenticatedAccountUuid(headers);
  if (!authenticatedAccountUuid || authenticatedAccountUuid !== accountUuid) {
    return null;
  }
  const found = findAppointment(uuid);
  const patient = getPatientByAccountUuid(accountUuid);
  return found?.Appointment.PatientUuid === patient?.Uuid ? found : null;
}

function findAppointment(uuid: string): OwnedAppointment | null {
  const appointment = mockAppointments.find(
    (item) => item.Uuid === uuid && item.DeletedAt.getTime() === 0,
  );
  return appointment
    ? { Type: toBookingType(appointment.Type), Appointment: appointment }
    : null;
}

function getAppointmentPresentations(accountUuid: string) {
  const patient = getPatientByAccountUuid(accountUuid);
  if (!patient) return [];
  return mockAppointments
    .filter(
      (item) =>
        item.PatientUuid === patient.Uuid && item.DeletedAt.getTime() === 0,
    )
    .map((item) => {
      const found = findAppointment(item.Uuid);
      return found
        ? buildAppointmentPresentation(found.Type, found.Appointment)
        : null;
    })
    .filter((item): item is AppointmentPresentation => Boolean(item));
}

function getAppointmentPresentation(uuid: string, accountUuid: string) {
  const found = findAppointment(uuid);
  const patient = getPatientByAccountUuid(accountUuid);
  if (!found || found.Appointment.PatientUuid !== patient?.Uuid) return null;
  return buildAppointmentPresentation(found.Type, found.Appointment);
}

function buildAppointmentPresentation(
  type: BookingType,
  appointment: Appointment,
): AppointmentPresentation | null {
  const hospital = mockHospitals.find((item) => item.Uuid === appointment.HospitalUuid);
  const room = mockRooms.find((item) => item.Uuid === appointment.RoomUuid);
  if (!hospital) return null;
  const appointmentView = toAppointmentView(appointment);
  if (!appointmentView) return null;

  if (type === "doctor" && appointment.DoctorUuid) {
    const doctor = mockDoctors.find((item) => item.Uuid === appointment.DoctorUuid);
    if (!doctor) return null;
    return {
      Type: type,
      Appointment: appointmentView,
      TargetName: doctor.Name,
      HospitalName: hospital.Name,
      HospitalSlug: hospital.Slug,
      TargetSlug: doctor.Slug,
      RoomName: room?.Name ?? "",
    };
  }
  if (type === "medical-service" && appointment.MedicalServiceUuid) {
    const service = mockMedicalServices.find(
      (item) => item.Uuid === appointment.MedicalServiceUuid,
    );
    if (!service) return null;
    return {
      Type: type,
      Appointment: appointmentView,
      TargetName: service.Name,
      HospitalName: hospital.Name,
      HospitalSlug: hospital.Slug,
      TargetSlug: service.Slug,
      RoomName: room?.Name ?? "",
    };
  }
  return {
    Type: "hospital",
    Appointment: appointmentView,
    TargetName: hospital.Name,
    HospitalName: hospital.Name,
    HospitalSlug: hospital.Slug,
    TargetSlug: hospital.Slug,
    RoomName: room?.Name ?? "",
  };
}

function validateEditable(appointment: Appointment): [number, unknown] | null {
  if (
    appointment.Status !== AppointmentStatus.Pending &&
    appointment.Status !== AppointmentStatus.Approved
  ) {
    return [409, errorBody("TERMINAL_STATUS", "Trạng thái lịch hẹn không cho phép thao tác này.")];
  }
  if (appointment.StartTime.getTime() - Date.now() < 24 * 60 * 60 * 1000) {
    return [409, errorBody("CHANGE_DEADLINE", "Chỉ có thể thao tác trước giờ khám ít nhất 24 giờ.")];
  }
  return null;
}

function resolveExistingBooking(owned: OwnedAppointment) {
  const { Appointment: appointment, Type: type } = owned;
  const targetUuid =
    type === "doctor" && appointment.DoctorUuid
      ? appointment.DoctorUuid
      : type === "medical-service" && appointment.MedicalServiceUuid
        ? appointment.MedicalServiceUuid
        : appointment.HospitalUuid;
  return resolveBooking(type, targetUuid, appointment.HospitalUuid);
}

function getBookingContext() {
  const hospitals = mockHospitals.filter(
    (item) => item.Status === BaseStatus.Active,
  );
  const hospitalUuids = new Set(hospitals.map((item) => item.Uuid));
  const doctors = mockDoctors.filter(
    (doctor) => hospitalUuids.has(doctor.HospitalUuid) && Boolean(findPublicDoctor(doctor.Uuid)),
  );
  const services = mockMedicalServices.filter(
    (item) => item.Status === BaseStatus.Active,
  );
  const serviceUuids = new Set(services.map((item) => item.Uuid));

  return {
    Hospitals: hospitals,
    Doctors: doctors,
    MedicalServices: services,
    HospitalMedicalServices: mockHospitalMedicalServices.filter(
      (relation) =>
        hospitalUuids.has(relation.HospitalUuid) &&
        serviceUuids.has(relation.MedicalServiceUuid),
    ),
  };
}

function resolveBooking(
  type: BookingType,
  targetUuid: string,
  hospitalUuid: string,
): ResolvedBooking | null {
  const hospital = findPublicHospital(hospitalUuid);
  if (!hospital) return null;
  const hospitalHours = parseWorkingHours(hospital.WorkingHour);
  if (!hospitalHours) return null;

  if (type === "hospital" && targetUuid === hospital.Uuid) {
    return { Type: type, Hospital: hospital, WorkingHours: hospitalHours };
  }
  if (type === "doctor") {
    const doctor = findPublicDoctor(targetUuid);
    if (!doctor || doctor.HospitalUuid !== hospital.Uuid) return null;
    return {
      Type: type,
      Hospital: hospital,
      Doctor: doctor,
      WorkingHours: hospitalHours,
    };
  }
  if (type === "medical-service") {
    const service = mockMedicalServices.find(
      (item) => item.Uuid === targetUuid && item.Status === BaseStatus.Active,
    );
    const relation = mockHospitalMedicalServices.some(
      (item) =>
        item.MedicalServiceUuid === targetUuid &&
        item.HospitalUuid === hospital.Uuid,
    );
    const serviceHours = service
      ? parseWorkingHours(service.WorkingHour)
      : null;
    const workingHours = serviceHours
      ? intersectWorkingHours(hospitalHours, serviceHours)
      : null;
    if (!service || !relation || !workingHours) return null;
    return {
      Type: type,
      Hospital: hospital,
      MedicalService: service,
      WorkingHours: workingHours,
    };
  }
  return null;
}

function findPublicHospital(uuid: string) {
  return mockHospitals.find(
    (item) => item.Uuid === uuid && item.Status === BaseStatus.Active,
  );
}

function findPublicDoctor(uuid: string) {
  const doctor = mockDoctors.find((item) => item.Uuid === uuid);
  const account = mockAccounts.find((item) => item.Uuid === doctor?.AccountUuid);
  const hospital = doctor ? findPublicHospital(doctor.HospitalUuid) : undefined;
  return account?.Status === BaseStatus.Active &&
    account.RoleUuid === ROLE_UUIDS.DOCTOR &&
    hospital
    ? doctor
    : undefined;
}

function validateWalkInGuest(
  request: CreateWalkInAppointmentRequest,
): [number, unknown] | null {
  if (
    typeof request.PatientName !== "string" ||
    typeof request.Gender !== "string" ||
    typeof request.Phone !== "string" ||
    typeof request.Birthdate !== "string" ||
    typeof request.MedicalCode !== "string" ||
    typeof request.Note !== "string" ||
    typeof request.HospitalUuid !== "string" ||
    typeof request.AppointmentAt !== "string"
  ) {
    return [
      422,
      errorBody("INVALID_REQUEST", "Thông tin khách vãng lai không hợp lệ."),
    ];
  }
  if (request.Type === "doctor" && typeof request.DoctorUuid !== "string") {
    return [422, errorBody("INVALID_REQUEST", "Thiếu thông tin bác sĩ.")];
  }
  if (
    request.Type === "medical-service" &&
    typeof request.MedicalServiceUuid !== "string"
  ) {
    return [422, errorBody("INVALID_REQUEST", "Thiếu thông tin dịch vụ.")];
  }
  if (
    request.PatientName.trim().length === 0 ||
    request.PatientName.trim().length > 100
  ) {
    return [
      422,
      errorBody("INVALID_PATIENT_INFO", "Tên khách vãng lai không hợp lệ."),
    ];
  }
  if (!Object.values(Gender).includes(request.Gender as Gender)) {
    return [422, errorBody("INVALID_PATIENT_INFO", "Giới tính không hợp lệ.")];
  }
  const phone = request.Phone.replace(/[\s.-]/g, "");
  if (!/^(0|\+84)[0-9]{9,10}$/.test(phone)) {
    return [
      422,
      errorBody("INVALID_PATIENT_INFO", "Số điện thoại không hợp lệ."),
    ];
  }
  if (!isValidDateString(request.Birthdate)) {
    return [
      422,
      errorBody("INVALID_PATIENT_INFO", "Ngày sinh không hợp lệ."),
    ];
  }
  const birth = new Date(`${request.Birthdate}T00:00:00+07:00`);
  if (birth.getTime() > Date.now()) {
    return [
      422,
      errorBody("INVALID_PATIENT_INFO", "Ngày sinh không hợp lệ."),
    ];
  }
  if (
    request.MedicalCode.trim().length === 0 ||
    request.MedicalCode.trim().length > 50
  ) {
    return [422, errorBody("INVALID_PATIENT_INFO", "Mã khám không hợp lệ.")];
  }
  if (request.Note.trim().length > 500) {
    return [422, errorBody("INVALID_NOTE", "Ghi chú tối đa 500 ký tự.")];
  }
  return null;
}

function validatePatient(
  request: CreateAppointmentRequest,
): [number, unknown] | null {
  if (
    typeof request.PatientName !== "string" ||
    typeof request.Gender !== "string" ||
    typeof request.Note !== "string" ||
    typeof request.MedicalCode !== "string" ||
    typeof request.AccountUuid !== "string"
  ) {
    return [
      422,
      errorBody("INVALID_REQUEST", "Thông tin lịch hẹn không hợp lệ."),
    ];
  }
  const account = mockAccounts.find(
    (item) =>
      item.Uuid === request.AccountUuid &&
      item.RoleUuid === ROLE_UUIDS.PATIENT &&
      item.Status === BaseStatus.Active,
  );
  const profile = mockPatientProfiles.find(
    (item) => item.AccountUuid === account?.Uuid,
  );
  if (!account || !profile) {
    return [
      403,
      errorBody("INVALID_PATIENT", "Hồ sơ người khám không hợp lệ."),
    ];
  }
  if (
    request.PatientName.trim().length === 0 ||
    request.PatientName.trim().length > 100 ||
    !Object.values(Gender).includes(request.Gender as Gender) ||
    request.MedicalCode.trim().length === 0 ||
    request.MedicalCode.trim().length > 50
  ) {
    return [
      422,
      errorBody("INVALID_PATIENT_INFO", "Thông tin người khám không hợp lệ."),
    ];
  }
  if (request.Note.trim().length > 500) {
    return [422, errorBody("INVALID_NOTE", "Ghi chú tối đa 500 ký tự.")];
  }
  return null;
}

function canBook(
  resolved: ResolvedBooking,
  appointmentAt: Date,
  patientUuid: string | null,
  excludeUuid?: string,
) {
  const timestamp = appointmentAt.getTime();
  if (hasPatientConflict(patientUuid, timestamp, excludeUuid)) return false;
  if (
    resolved.Doctor &&
    mockAppointments.some(
      (item) =>
        item.DoctorUuid === resolved.Doctor?.Uuid &&
        item.StartTime.getTime() === timestamp &&
        isBlockingAppointment(item, excludeUuid),
    )
  ) {
    return false;
  }
  return hasHospitalCapacity(resolved.Hospital.Uuid, timestamp, excludeUuid);
}

function hasHospitalCapacity(
  hospitalUuid: string,
  timestamp: number,
  excludeUuid?: string,
) {
  const numberOfRooms = mockRooms.filter(
    (room) =>
      room.HospitalUuid === hospitalUuid &&
      room.Status === RoomStatus.Available,
  ).length;
  const numberOfAppointments = mockAppointments.filter(
    (item) =>
      item.HospitalUuid === hospitalUuid &&
      item.StartTime.getTime() === timestamp &&
      isBlockingAppointment(item, excludeUuid),
  ).length;
  return numberOfAppointments < numberOfRooms;
}

function hasPatientConflict(patientUuid: string | null, timestamp: number, excludeUuid?: string) {
  if (!patientUuid) return false;
  return mockAppointments.some(
    (item) =>
      item.PatientUuid === patientUuid &&
      item.StartTime.getTime() === timestamp &&
      isBlockingAppointment(item, excludeUuid),
  );
}

function isBlockingAppointment(appointment: Appointment, excludeUuid?: string) {
  return (
    appointment.Uuid !== excludeUuid &&
    appointment.DeletedAt.getTime() === 0 &&
    appointment.Status !== AppointmentStatus.Cancelled
  );
}

function toAppointmentView(appointment: Appointment): AppointmentView | null {
  const patient = appointment.PatientUuid
    ? mockPatientProfiles.find((item) => item.Uuid === appointment.PatientUuid)
    : null;
  const common = {
    Uuid: appointment.Uuid,
    PatientName: appointment.PatientName,
    Gender: appointment.Gender,
    Note: appointment.Note,
    MedicalCode: appointment.MedicalCode,
    AppointmentAt: appointment.StartTime,
    Status: appointment.Status,
    AccountUuid: patient?.AccountUuid ?? "",
    HospitalUuid: appointment.HospitalUuid,
    RoomUuid: appointment.RoomUuid ?? "",
    IsWalkIn: appointment.IsWalkIn,
    GuestPhone: appointment.GuestPhone,
    CreatedAt: appointment.CreatedAt,
    UpdatedAt: appointment.UpdatedAt,
  };
  if (appointment.Type === AppointmentType.Doctor && appointment.DoctorUuid) {
    return { ...common, DoctorUuid: appointment.DoctorUuid };
  }
  if (
    appointment.Type === AppointmentType.Service &&
    appointment.MedicalServiceUuid
  ) {
    return { ...common, MedicalServiceUuid: appointment.MedicalServiceUuid };
  }
  return common;
}

function toBookingType(type: AppointmentType): BookingType {
  if (type === AppointmentType.Doctor) return "doctor";
  if (type === AppointmentType.Service) return "medical-service";
  return "hospital";
}

function getPatientByAccountUuid(accountUuid: string) {
  return mockPatientProfiles.find((item) => item.AccountUuid === accountUuid);
}

function parseBody<T>(data: unknown): T {
  return typeof data === "string" ? (JSON.parse(data) as T) : (data as T);
}

function parsePositiveInteger(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function isBookingType(value: string): value is BookingType {
  return value === "hospital" || value === "doctor" || value === "medical-service";
}

function createdResponse(appointment: object): [number, unknown] {
  return [
    201,
    { Data: appointment, Message: "Gửi yêu cầu đặt lịch thành công." },
  ];
}

function confirmationResponse(
  type: BookingType,
  appointment: object,
  targetName: string,
  hospitalName: string,
): [number, unknown] {
  return [
    200,
    {
      Data: {
        Type: type,
        Appointment: appointment,
        TargetName: targetName,
        HospitalName: hospitalName,
      },
      Message: "Lấy xác nhận lịch hẹn thành công.",
    },
  ];
}

function errorBody(code: string, message: string) {
  return { Code: code, Message: message };
}

function invalidBranchResponse(): [number, unknown] {
  return [
    422,
    errorBody("INVALID_BOOKING_CONTEXT", "Đối tượng hoặc cơ sở không hợp lệ."),
  ];
}

function notFoundResponse(): [number, unknown] {
  return [404, errorBody("NOT_FOUND", "Không tìm thấy lịch hẹn.")];
}

function unauthorizedResponse(): [number, unknown] {
  return [403, errorBody("UNAUTHORIZED", "Phiên đăng nhập không hợp lệ.")];
}

function getAuthenticatedAccountUuid(headers: unknown) {
  if (!headers || typeof headers !== "object") return "";
  const get = (headers as { get?: (name: string) => unknown }).get;
  const value =
    typeof get === "function"
      ? get.call(headers, "X-Mock-Account-Uuid")
      : (headers as Record<string, unknown>)["X-Mock-Account-Uuid"];
  if (typeof value !== "string") return "";
  const account = mockAccounts.find(
    (item) =>
      item.Uuid === value &&
      item.RoleUuid === ROLE_UUIDS.PATIENT &&
      item.Status === BaseStatus.Active,
  );
  const profile = mockPatientProfiles.find(
    (item) => item.AccountUuid === account?.Uuid,
  );
  return account && profile ? account.Uuid : "";
}

function getAuthenticatedStaffUuid(headers: unknown) {
  if (!headers || typeof headers !== "object") return "";
  const get = (headers as { get?: (name: string) => unknown }).get;
  const value =
    typeof get === "function"
      ? get.call(headers, "X-Mock-Account-Uuid")
      : (headers as Record<string, unknown>)["X-Mock-Account-Uuid"];
  if (typeof value !== "string") return "";
  const account = mockAccounts.find(
    (item) =>
      item.Uuid === value &&
      item.RoleUuid === ROLE_UUIDS.STAFF &&
      item.Status === BaseStatus.Active,
  );
  return account ? account.Uuid : "";
}
