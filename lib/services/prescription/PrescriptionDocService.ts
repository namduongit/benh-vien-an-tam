import { httpClient } from "@/lib/http/client";
import type { ApiResponse, PaginatedData } from "@/lib/http/response";
import type {
    CancelPrescriptionPayload,
    PrescriptionDetail,
    PrescriptionListItem,
    PrescriptionMetrics,
    PrescriptionQuery,
} from "@/types/prescription-doc";

export const prescriptionDocService = {
    /**
     * Lấy số liệu thống kê đơn thuốc (Theo tháng / ngày)
     */
    async getMetrics(
        date?: string,
        signal?: AbortSignal
    ): Promise<PrescriptionMetrics> {
        const response = await httpClient.get<
            PrescriptionMetrics | ApiResponse<PrescriptionMetrics>
        >("/v1/prescriptions/metrics", {
            params: { date },
            signal,
        });

        // Linh hoạt xử lý nếu Backend trả về trực tiếp object hoặc gói trong { Data: ... }
        if ("Data" in response.data && response.data.Data) {
            return response.data.Data;
        }
        return response.data as PrescriptionMetrics;
    },

    /**
     * Lấy danh sách đơn thuốc có phân trang, lọc theo ngày, trạng thái và từ khóa
     */
    async getPrescriptions(
        query: PrescriptionQuery,
        signal?: AbortSignal
    ): Promise<PaginatedData<PrescriptionListItem>> {
        const response = await httpClient.get<
            | PaginatedData<PrescriptionListItem>
            | ApiResponse<PaginatedData<PrescriptionListItem>>
        >("/v1/prescriptions", {
            params: {
                search: query.search?.trim() || undefined,
                date: query.date || undefined,
                status:
                    query.status && query.status !== "Tất cả trạng thái"
                        ? query.status
                        : undefined,
                page: query.page ?? 1,
                pageSize: query.pageSize ?? 20,
            },
            signal,
        });

        if ("Data" in response.data && response.data.Data) {
            return response.data.Data;
        }
        return response.data as PaginatedData<PrescriptionListItem>;
    },

    /**
     * Lấy chi tiết đơn thuốc theo UUID
     */
    async getPrescriptionDetail(
        uuid: string,
        signal?: AbortSignal
    ): Promise<PrescriptionDetail> {
        const response = await httpClient.get<
            PrescriptionDetail | ApiResponse<PrescriptionDetail>
        >(`/v1/prescriptions/${uuid}`, { signal });

        if ("Data" in response.data && response.data.Data) {
            return response.data.Data;
        }
        return response.data as PrescriptionDetail;
    },

    /**
     * Hủy đơn thuốc (chỉ dành cho đơn chưa thanh toán - Unpaid)
     */
    async cancelPrescription(
        uuid: string,
        payload: CancelPrescriptionPayload
    ): Promise<void> {
        await httpClient.post(`/v1/prescriptions/${uuid}/cancel`, payload);
    },
};