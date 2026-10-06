import type AxiosMockAdapter from "axios-mock-adapter";

import { mockInternalClinicalAppointments } from "@/data/mocks/internal-clinical-appointments";
import { mockMedicalServices } from "@/data/mocks/medical-services";
import { mockMedicines } from "@/data/mocks/medicines";
import { getVietnamDateTimeParts } from "@/lib/booking/working-hours";
import type { ClinicalMedicalService } from "@/types/internal-clinical";

const clinicalMedicalServices: ClinicalMedicalService[] = [
  {
    Uuid: "6217488b-bfe5-4754-b072-aa0424d7a101",
    AppointmentUuid: "9df649f8-a02d-41a4-a1ab-5a0a377ff103",
    MedicalServiceUuid: "d531fbd6-998a-49df-9e68-4388b8bf388b",
    Name: "Siêu âm tổng quát",
    Price: 450000,
    Description: "",
    Status: "InProgress",
  },
];

export function registerInternalClinicalRoutes(mock: AxiosMockAdapter) {
  mock.onGet("/internal/clinical/appointments").reply((config) => {
    const date = typeof config.params?.date === "string" ? config.params.date : "";
    const items = mockInternalClinicalAppointments.filter(
      (item) => !date || getVietnamDateTimeParts(item.AppointmentAt).Date === date,
    );

    return [
      200,
      { Data: items, Message: "Lấy lịch khám được phân công thành công." },
    ];
  });

  mock
    .onGet(/^\/internal\/clinical\/appointments\/[^/]+$/)
    .reply((config) => {
      const uuid = decodeURIComponent(config.url?.split("/").pop() ?? "");
      const item = mockInternalClinicalAppointments.find(
        (appointment) => appointment.Uuid === uuid,
      );

      return item
        ? [
            200,
            {
              Data: buildCaseDetail(item),
              Message: "Lấy thông tin ca khám thành công.",
            },
          ]
        : [404, { Message: "Không tìm thấy ca khám.", Code: "NOT_FOUND" }];
    });

  mock
    .onPost(/^\/internal\/clinical\/appointments\/[^/]+\/medical-services$/)
    .reply((config) => {
      const segments = config.url?.split("/") ?? [];
      const appointmentUuid = decodeURIComponent(segments.at(-2) ?? "");
      const body = parseBody<{ MedicalServiceUuid?: string }>(config.data);
      const appointment = mockInternalClinicalAppointments.find(
        (item) => item.Uuid === appointmentUuid,
      );
      const service = mockMedicalServices.find(
        (item) => item.Uuid === body.MedicalServiceUuid,
      );
      if (!appointment || !service) {
        return [404, { Message: "Không tìm thấy ca khám hoặc dịch vụ." }];
      }
      if (
        clinicalMedicalServices.some(
          (item) =>
            item.AppointmentUuid === appointmentUuid &&
            item.MedicalServiceUuid === service.Uuid,
        )
      ) {
        return [409, { Message: "Dịch vụ này đã được chỉ định cho ca khám." }];
      }

      const item: ClinicalMedicalService = {
        Uuid: crypto.randomUUID(),
        AppointmentUuid: appointmentUuid,
        MedicalServiceUuid: service.Uuid,
        Name: service.Name,
        Price: service.Price,
        Description: "",
        Status: "InProgress",
      };
      clinicalMedicalServices.push(item);
      return [201, { Data: item, Message: "Thêm chỉ định dịch vụ thành công." }];
    });

  mock
    .onPut(
      /^\/internal\/clinical\/appointments\/[^/]+\/medical-services\/[^/]+$/,
    )
    .reply((config) => {
      const segments = config.url?.split("/") ?? [];
      const appointmentUuid = decodeURIComponent(segments.at(-3) ?? "");
      const uuid = decodeURIComponent(segments.at(-1) ?? "");
      const body = parseBody<{
        Description?: string;
        Status?: ClinicalMedicalService["Status"];
      }>(config.data);
      const item = clinicalMedicalServices.find(
        (service) =>
          service.Uuid === uuid && service.AppointmentUuid === appointmentUuid,
      );
      if (!item) return [404, { Message: "Không tìm thấy dịch vụ chỉ định." }];
      const description = body.Description?.trim() ?? item.Description;
      if (body.Status === "Completed" && !description) {
        return [422, { Message: "Vui lòng nhập kết quả trước khi hoàn tất dịch vụ." }];
      }
      item.Description = description;
      if (body.Status === "Completed" || body.Status === "InProgress") {
        item.Status = body.Status;
      }
      return [200, { Data: item, Message: "Cập nhật dịch vụ thành công." }];
    });
}

function buildCaseDetail(
  appointment: (typeof mockInternalClinicalAppointments)[number],
) {
  return {
    ...appointment,
    MedicalServices: clinicalMedicalServices.filter(
      (item) => item.AppointmentUuid === appointment.Uuid,
    ),
    AvailableMedicalServices: mockMedicalServices
      .filter((item) => item.Status === "Active")
      .map((item) => ({ Uuid: item.Uuid, Name: item.Name, Price: item.Price })),
    AvailableMedicines: mockMedicines
      .filter((item) => item.Status === "Active")
      .map((item) => ({ Uuid: item.Uuid, Name: item.Name, Unit: item.Unit })),
  };
}

function parseBody<T>(value: unknown): T {
  if (typeof value === "string") return JSON.parse(value) as T;
  return (value ?? {}) as T;
}
