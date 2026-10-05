import type AxiosMockAdapter from "axios-mock-adapter";
import { mockMedicines } from "@/data/mocks/medicines";
import { mockMedicineInventories } from "@/data/mocks/medicine-inventories";
import { StockStatusFilter } from "@/types/medicine";
import type {
    MedicineDetailDto,
    MedicineDto,
    PaginatedResult,
} from "@/types/medicine";
import type { ApiResponse } from "@/lib/http/response";

// Helper gộp dữ liệu từ mockMedicines và mockMedicineInventories
function getCombinedMedicines(): MedicineDetailDto[] {
    return mockMedicines.map((med) => {
        const inv = mockMedicineInventories.find(
            (i) => i.MedicineUuid === med.Uuid
        );
        const stock = inv ? inv.Quantity : 0;
        const minStock = inv ? inv.MinimumQuantity : 0;

        // Tính toán trạng thái tồn kho
        let status: StockStatusFilter = StockStatusFilter.InStock;
        if (stock === 0) {
            status = StockStatusFilter.OutOfStock;
        } else if (stock <= minStock) {
            status = StockStatusFilter.LowStock;
        }

        return {
            uuid: med.Uuid,
            name: med.Name,
            unit: med.Unit,
            price: med.Price,
            stock,
            minStock,
            status,
            description: med.Description,
            isInsured: med.IsInsured,
            insuranceCap: med.InsuranceCap,
        };
    });
}

export function registerAvailableMedicineRoutes(mock: AxiosMockAdapter) {
    // 1. GET /api/AvailableMedicine/units - Lấy danh sách các đơn vị tính
    mock.onGet("/api/AvailableMedicine/units").reply(() => {
        const units = Array.from(new Set(mockMedicines.map((m) => m.Unit)));

        const response: ApiResponse<string[]> = {
            Data: units,
            Message: "Lấy danh sách đơn vị tính thành công.",
        };

        return [200, response];
    });

    // 2. GET /api/AvailableMedicine - Lấy danh sách thuốc (Lọc & Phân trang)
    mock.onGet("/api/AvailableMedicine").reply((config) => {
        const params = config.params || {};
        const pageIndex = Number(params.pageIndex) || 1;
        const pageSize = Number(params.pageSize) || 5;
        const search = (params.search || "").toString().toLowerCase().trim();
        const unit = (params.unit || "").toString().trim();
        const stockStatus = params.stockStatus;

        let allItems = getCombinedMedicines();

        // Lọc theo từ khóa tìm kiếm
        if (search) {
            allItems = allItems.filter((item) =>
                item.name.toLowerCase().includes(search)
            );
        }

        // Lọc theo đơn vị tính
        if (unit) {
            allItems = allItems.filter((item) => item.unit === unit);
        }

        // Lọc theo trạng thái tồn kho
        if (stockStatus !== undefined && stockStatus !== null && stockStatus !== "") {
            const statusNum = Number(stockStatus);
            allItems = allItems.filter((item) => item.status === statusNum);
        }

        // Phân trang
        const totalCount = allItems.length;
        const totalPages = Math.ceil(totalCount / pageSize) || 1;
        const startIndex = (pageIndex - 1) * pageSize;

        const paginatedItems: MedicineDto[] = allItems
            .slice(startIndex, startIndex + pageSize)
            .map(({ description, isInsured, insuranceCap, ...dto }) => dto);

        const result: PaginatedResult<MedicineDto> = {
            items: paginatedItems,
            pageIndex,
            pageSize,
            totalCount,
            totalPages,
        };

        const response: ApiResponse<PaginatedResult<MedicineDto>> = {
            Data: result,
            Message: "Lấy danh sách thuốc khả dụng thành công.",
        };

        return [200, response];
    });

    // 3. GET /api/AvailableMedicine/:uuid - Lấy chi tiết thuốc theo UUID
    mock.onGet(/\/api\/AvailableMedicine\/(?!units$).+/).reply((config) => {
        const urlParts = config.url?.split("/") || [];
        const uuid = urlParts[urlParts.length - 1];

        const allItems = getCombinedMedicines();
        const medicine = allItems.find((item) => item.uuid === uuid);

        if (!medicine) {
            const errorResponse: ApiResponse<null> = {
                Data: null,
                Message: "Không tìm thấy thông tin thuốc.",
            };
            return [404, errorResponse];
        }

        const response: ApiResponse<MedicineDetailDto> = {
            Data: medicine,
            Message: "Lấy thông tin chi tiết thuốc thành công.",
        };

        return [200, response];
    });
}