import type AxiosMockAdapter from "axios-mock-adapter";
import { mockInternalClinicalAppointments } from "@/data/mocks/internal-clinical-appointments";
import { mockMedicalServices } from "@/data/mocks/medical-services";
import { mockMedicines } from "@/data/mocks/medicines";
import { getVietnamDateTimeParts } from "@/lib/booking/working-hours";
import type { ClinicalMedicalService } from "@/types/internal-clinical";

// In-memory store cho danh sách dịch vụ chỉ định của các ca khám
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

// In-memory store cho đơn thuốc theo appointmentUuid
const prescriptionsMap: Record<string, any> = {
    "9df649f8-a02d-41a4-a1ab-5a0a377ff103": {
        Uuid: "pres-1",
        Status: "Unpaid",
        Note: "Tái khám sau 7 ngày nếu không đỡ.",
        Details: [
            {
                Uuid: "pd-1",
                MedicineUuid: "med-1",
                MedicineName: "Paracetamol 500mg",
                Unit: "Viên",
                Quantity: 10,
                QuantityPerDose: 1,
                DosesPerDay: 2,
                Duration: 5,
                Note: "Uống khi sốt trên 38.5 độ",
            },
        ],
    },
};

export function registerInternalClinicalRoutes(mock: AxiosMockAdapter) {
    // 1. Lấy danh sách lịch khám theo ngày
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

    // 2. Lấy chi tiết ca khám theo UUID
    mock
        .onGet(/^\/internal\/clinical\/appointments\/[^/]+?$/)
        .reply((config) => {
            // Đảm bảo không bắt nhầm các route con như /medical-services hay /prescription
            const urlPath = config.url?.split("?")[0] ?? "";
            const segments = urlPath.split("/");
            const uuid = decodeURIComponent(segments.pop() ?? "");

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

    // 3. Cập nhật trạng thái ca khám (Bắt đầu khám -> CheckedIn, Hủy ca -> Cancelled, Hoàn thành -> Done)
    mock
        .onPut(/^\/internal\/clinical\/appointments\/[^/]+\/status$/)
        .reply((config) => {
            const segments = config.url?.split("/") ?? [];
            const uuid = decodeURIComponent(segments.at(-2) ?? "");
            const body = parseBody<{ Status?: string }>(config.data);
            const appointment = mockInternalClinicalAppointments.find(
                (item) => item.Uuid === uuid,
            );

            if (!appointment) {
                return [404, { Message: "Không tìm thấy ca khám." }];
            }

            // Kiểm tra nghiệp vụ khi bấm nút "Hoàn thành ca"
            if (body.Status === "Done") {
                if (!appointment.DoctorNote || !appointment.DoctorNote.trim()) {
                    return [400, { Message: "Vui lòng nhập thông tin chẩn đoán trước khi hoàn thành ca khám." }];
                }
                const services = clinicalMedicalServices.filter((s) => s.AppointmentUuid === uuid);
                const allCompleted = services.every((s) => s.Status === "Completed" && s.Description?.trim());
                if (services.length > 0 && !allCompleted) {
                    return [400, { Message: "Tất cả dịch vụ chỉ định phải hoàn thành và có kết quả đầy đủ." }];
                }
            }

            if (body.Status) {
                appointment.Status = body.Status as any;
            }

            return [200, { Data: true, Message: "Cập nhật trạng thái ca khám thành công." }];
        });

    // 4. Thêm dịch vụ khám vào ca khám
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

    // 5. Cập nhật dịch vụ khám (Nút "Lưu kết quả" hoặc "Hoàn tất dịch vụ")
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

            // Nếu bấm hoàn tất dịch vụ mà chưa nhập kết quả -> Báo lỗi
            if (body.Status === "Completed" && !description) {
                return [422, { Message: "Vui lòng nhập kết quả trước khi hoàn tất dịch vụ." }];
            }

            item.Description = description;
            if (body.Status === "Completed" || body.Status === "InProgress") {
                item.Status = body.Status;
            }

            return [200, { Data: item, Message: "Cập nhật dịch vụ thành công." }];
        });

    // 6. Lưu thông tin chẩn đoán (Nút "Lưu chẩn đoán")
    mock
        .onPost(/^\/internal\/clinical\/appointments\/[^/]+\/diagnosis$/)
        .reply((config) => {
            const segments = config.url?.split("/") ?? [];
            const uuid = decodeURIComponent(segments.at(-2) ?? "");
            const body = parseBody<{ DoctorNote?: string }>(config.data);
            const appointment = mockInternalClinicalAppointments.find(
                (item) => item.Uuid === uuid,
            );
            if (!appointment) return [404, { Message: "Không tìm thấy ca khám." }];

            if (!body.DoctorNote || !body.DoctorNote.trim()) {
                return [400, { Message: "Thông tin chẩn đoán không được để trống." }];
            }

            appointment.DoctorNote = body.DoctorNote.trim();
            return [200, { Data: true, Message: "Lưu chẩn đoán thành công." }];
        });

    // 7. Tìm kiếm thuốc (Hỗ trợ debounce, tối đa 10 kết quả)
    mock.onGet(/^\/internal\/clinical\/medicines\/search(?:\?.*)?$/).reply((config) => {
        const urlParams = new URLSearchParams(config.url?.split("?")[1] || "");
        const keyword = (config.params?.keyword || urlParams.get("keyword") || "").toLowerCase();

        const matched = mockMedicines
            .filter((m) => m.Status === "Active" && m.Name.toLowerCase().includes(keyword))
            .slice(0, 10)
            .map((m) => ({
                Uuid: m.Uuid,
                Name: m.Name,
                Unit: m.Unit,
            }));

        return [200, { Data: matched, Message: "Tìm kiếm thuốc thành công." }];
    });

    // 8. Lấy thông tin đơn thuốc của ca khám
    mock
        .onGet(/^\/internal\/clinical\/appointments\/[^/]+\/prescription$/)
        .reply((config) => {
            const segments = config.url?.split("/") ?? [];
            const uuid = decodeURIComponent(segments.at(-2) ?? "");
            const prescription = prescriptionsMap[uuid];
            if (!prescription) {
                return [404, { Message: "Chưa có đơn thuốc." }];
            }
            return [200, { Data: prescription, Message: "Lấy đơn thuốc thành công." }];
        });

    // 9. Lưu đơn thuốc cho ca khám (Nút "Lưu đơn thuốc")
    mock
        .onPost(/^\/internal\/clinical\/appointments\/[^/]+\/prescription$/)
        .reply((config) => {
            const segments = config.url?.split("/") ?? [];
            const uuid = decodeURIComponent(segments.at(-2) ?? "");
            const body = parseBody<{
                Note?: string;
                Items?: Array<{
                    MedicineUuid: string;
                    Quantity: number;
                    QuantityPerDose: number;
                    DosesPerDay: number;
                    Duration: number;
                    Note: string;
                }>;
            }>(config.data);

            if (prescriptionsMap[uuid] && prescriptionsMap[uuid].Status !== "Unpaid") {
                return [400, { Message: "Đơn thuốc đã thanh toán hoặc đã hủy, không thể chỉnh sửa." }];
            }

            const newPrescription = {
                Uuid: prescriptionsMap[uuid]?.Uuid || crypto.randomUUID(),
                Status: "Unpaid" as const,
                Note: body.Note ?? "",
                Details: (body.Items ?? []).map((item, idx) => {
                    const med = mockMedicines.find((m) => m.Uuid === item.MedicineUuid);
                    return {
                        Uuid: `pd-${Date.now()}-${idx}`,
                        MedicineUuid: item.MedicineUuid,
                        MedicineName: med?.Name ?? "Thuốc",
                        Unit: med?.Unit ?? "Viên",
                        Quantity: item.Quantity,
                        QuantityPerDose: item.QuantityPerDose,
                        DosesPerDay: item.DosesPerDay,
                        Duration: item.Duration,
                        Note: item.Note,
                    };
                }),
            };

            prescriptionsMap[uuid] = newPrescription;
            return [200, { Data: newPrescription, Message: "Lưu đơn thuốc thành công." }];
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
        Prescription: prescriptionsMap[appointment.Uuid] || null,
    };
}

function parseBody<T>(value: unknown): T {
    if (typeof value === "string") return JSON.parse(value) as T;
    return (value ?? {}) as T;
}