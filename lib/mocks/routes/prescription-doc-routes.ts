import type AxiosMockAdapter from "axios-mock-adapter";
import type {
    PrescriptionDetail,
    PrescriptionListItem,
    PrescriptionMetrics,
} from "@/types/prescription-doc";

// Khởi tạo dữ liệu Mock đầy đủ cấu trúc chi tiết cho Modal
let mockPrescriptionDetailsList: PrescriptionDetail[] = [
    {
        uuid: "e0000000-0000-0000-0000-000000000001",
        rxCode: "RX2026100901",
        status: "Unpaid",
        createdAt: "2026-10-09 08:30",
        note: "Uống thuốc sau khi ăn no, nghỉ ngơi hợp lý, tái khám sau 7 ngày.",
        patient: {
            medicalCode: "BN-2026-0001",
            insuranceCode: "DN479792100888",
            name: "Nguyễn Văn An",
            gender: "Nam",
            birthdate: "20/05/1995 (31 tuổi)",
        },
        appointment: {
            uuid: "d0000000-0000-0000-0000-000000000001",
            code: "CK-20261009-01",
            type: "Khám chuyên khoa",
            time: "08:00 - 08:30 (09/10/2026)",
            roomName: "Phòng Khám Nội 101",
            doctorNote: "Bệnh nhân viêm họng cấp, sốt nhẹ 38 độ, ho nhiều về đêm.",
        },
        details: [
            {
                medicineUuid: "70000000-0000-0000-0000-000000000001",
                medicineName: "Paracetamol 500mg",
                unit: "Viên",
                quantity: 10,
                price: 1500,
                isInsured: true,
                insuranceCap: 80,
                isExternal: false,
                quantityPerDose: 1,
                dosesPerDay: 2,
                duration: 5,
                note: "Uống khi sốt trên 38.5 độ",
            },
            {
                medicineUuid: "70000000-0000-0000-0000-000000000002",
                medicineName: "Amoxicillin 500mg",
                unit: "Viên",
                quantity: 14,
                price: 3000,
                isInsured: true,
                insuranceCap: 70,
                isExternal: false,
                quantityPerDose: 1,
                dosesPerDay: 2,
                duration: 7,
                note: "Uống sáng và tối sau khi ăn no",
            },
            {
                medicineUuid: "70000000-0000-0000-0000-000000000003",
                medicineName: "Siro Ho Astex 90ml",
                unit: "Chai",
                quantity: 1,
                price: 45000,
                isInsured: false,
                insuranceCap: 0,
                isExternal: true, // Thuốc mua ngoài
                quantityPerDose: 10,
                dosesPerDay: 3,
                duration: 5,
                note: "Uống trực tiếp sau ăn",
            },
        ],
    },
    {
        uuid: "e0000000-0000-0000-0000-000000000002",
        rxCode: "RX2026100902",
        status: "Paid",
        createdAt: "2026-10-09 09:15",
        note: "Dùng thuốc đều đặn theo chỉ định.",
        patient: {
            medicalCode: "BN-2026-0002",
            insuranceCode: "", // Không có BHYT
            name: "Trần Thị Bình",
            gender: "Nữ",
            birthdate: "14/08/1998 (28 tuổi)",
        },
        appointment: {
            uuid: "d0000000-0000-0000-0000-000000000002",
            code: "CK-20261009-02",
            type: "Khám tổng quát",
            time: "09:00 - 09:30 (09/10/2026)",
            roomName: "Phòng Khám Nội 101",
            doctorNote: "Bệnh nhân đau đầu nhẹ do căng thẳng công việc.",
        },
        details: [
            {
                medicineUuid: "70000000-0000-0000-0000-000000000001",
                medicineName: "Paracetamol 500mg",
                unit: "Viên",
                quantity: 10,
                price: 1500,
                isInsured: false,
                insuranceCap: 0,
                isExternal: false,
                quantityPerDose: 1,
                dosesPerDay: 2,
                duration: 5,
                note: "Uống sau ăn",
            },
        ],
    },
];

export function registerDoctorPrescriptionRoutes(mock: AxiosMockAdapter) {
    // 1. GET /v1/prescriptions/metrics - Thống kê số lượng đơn
    mock.onGet("/v1/prescriptions/metrics").reply(() => {
        const metricsData: PrescriptionMetrics = {
            monthlyCount: mockPrescriptionDetailsList.length,
            monthlyDiffFromLastMonth: 3,
            unpaidCount: mockPrescriptionDetailsList.filter((x) => x.status === "Unpaid").length,
            paidCount: mockPrescriptionDetailsList.filter((x) => x.status === "Paid").length,
            cancelledCount: mockPrescriptionDetailsList.filter((x) => x.status === "Cancelled").length,
        };

        return [200, { Data: metricsData, Message: "Lấy số liệu thống kê thành công." }];
    });

    // 2. GET /v1/prescriptions - Danh sách đơn thuốc cho Bảng
    mock.onGet("/v1/prescriptions").reply((config) => {
        const { search, date, status, page = 1, pageSize = 20 } = config.params || {};

        // Map từ dữ liệu chi tiết sang dữ liệu danh sách bảng
        let listItems: PrescriptionListItem[] = mockPrescriptionDetailsList.map((item) => ({
            uuid: item.uuid,
            rxCode: item.rxCode,
            patientName: item.patient.name,
            createdAt: item.createdAt,
            medicineCount: item.details.length,
            totalAmount: item.details
                .filter((d) => !d.isExternal)
                .reduce((sum, d) => sum + d.price * d.quantity, 0),
            status: item.status,
        }));

        // Lọc theo từ khóa
        if (search) {
            const keyword = String(search).toLowerCase().trim();
            listItems = listItems.filter(
                (i) =>
                    i.rxCode.toLowerCase().includes(keyword) ||
                    i.patientName.toLowerCase().includes(keyword)
            );
        }

        // Lọc theo trạng thái
        if (status && status !== "Tất cả trạng thái") {
            listItems = listItems.filter((i) => i.status === status);
        }

        const p = Number(page) || 1;
        const ps = Number(pageSize) || 20;

        return [
            200,
            {
                Data: {
                    Items: listItems.slice((p - 1) * ps, p * ps),
                    Page: p,
                    PageSize: ps,
                    TotalItems: listItems.length,
                    TotalPages: Math.ceil(listItems.length / ps) || 1,
                },
                Message: "Lấy danh sách đơn thuốc thành công.",
            },
        ];
    });

    // 3. GET /v1/prescriptions/:uuid - Lấy Chi tiết đơn thuốc mở Modal
    mock.onGet(/^\/v1\/prescriptions\/[^/]+$/).reply((config) => {
        const uuid = decodeURIComponent(config.url?.split("/").pop() ?? "");
        const detail = mockPrescriptionDetailsList.find((x) => x.uuid === uuid);

        if (!detail) {
            return [404, { Message: "Không tìm thấy chi tiết đơn thuốc." }];
        }

        return [200, { Data: detail, Message: "Lấy chi tiết đơn thuốc thành công." }];
    });

    // 4. POST /v1/prescriptions/:uuid/cancel - Xử lý Hủy đơn từ Modal
    mock.onPost(/^\/v1\/prescriptions\/[^/]+\/cancel$/).reply((config) => {
        const urlParts = config.url?.split("/") || [];
        const uuid = urlParts[urlParts.length - 2];

        const target = mockPrescriptionDetailsList.find((x) => x.uuid === uuid);
        if (target) {
            target.status = "Cancelled";
        }

        return [200, { Message: "Hủy đơn thuốc thành công." }];
    });
}