"use client";

import { useState, ReactNode, useEffect, useCallback } from "react";
import {
    MetricCard,
    MetricGrid,
    PortalAction,
    PortalPageHeader,
    PortalSection,
    PortalTable,
    StatusPill,
} from "@/components/internal/portal-ui";
import { Activity, CheckCircle2, Clock3, Pill, Loader2 } from "lucide-react";
import { PrescriptionDetailModal } from "./prescription-detail-modal";
import { prescriptionDocService } from "@/lib/services/prescription/PrescriptionDocService";
import { useDebounce } from "@/hooks/use-debounce";
import type {
    PrescriptionDetail,
    PrescriptionListItem,
    PrescriptionMetrics,
    PrescriptionStatus,
} from "@/types/prescription-doc";

// Lấy ngày hôm nay định dạng YYYY-MM-DD
const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const statusToneMap: Record<PrescriptionStatus, "amber" | "green" | "red"> = {
    Unpaid: "amber",
    Paid: "green",
    Cancelled: "red",
};

const statusLabelMap: Record<PrescriptionStatus, string> = {
    Unpaid: "Chưa thanh toán",
    Paid: "Đã thanh toán",
    Cancelled: "Đã hủy",
};

export function DoctorPrescriptionsScreen() {
    const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // States quản lý Filter
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 1200); // Tự động load sau 1.2s nhập
    const [selectedDate, setSelectedDate] = useState<string>(getTodayString);
    const [statusFilter, setStatusFilter] = useState("Tất cả trạng thái");

    // API States
    const [metrics, setMetrics] = useState<PrescriptionMetrics | null>(null);
    const [items, setItems] = useState<PrescriptionListItem[]>([]);
    const [listLoading, setListLoading] = useState(true);
    const [listError, setListError] = useState<string | null>(null);

    // Detail Modal States
    const [detailData, setDetailData] = useState<PrescriptionDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Fetch Thống kê Metric
    const fetchMetrics = useCallback(async (dateStr: string) => {
        try {
            const data = await prescriptionDocService.getMetrics(dateStr);
            setMetrics(data);
        } catch (err) {
            console.error("Lỗi khi tải thống kê đơn thuốc:", err);
        }
    }, []);

    // Fetch Danh sách Đơn thuốc
    const fetchList = useCallback(
        async (search: string, dateStr: string, status: string) => {
            setListLoading(true);
            setListError(null);
            try {
                const res = await prescriptionDocService.getPrescriptions({
                    search,
                    date: dateStr,
                    status: status !== "Tất cả trạng thái" ? status : undefined,
                    page: 1,
                    pageSize: 50,
                });
                setItems(res.Items || []);
            } catch (err) {
                console.error("Lỗi khi tải danh sách đơn thuốc:", err);
                setListError("Không thể tải danh sách đơn thuốc. Vui lòng thử lại sau.");
            } finally {
                setListLoading(false);
            }
        },
        []
    );

    // Tải lại toàn bộ dữ liệu
    const reloadData = useCallback(() => {
        fetchMetrics(selectedDate);
        fetchList(debouncedSearch, selectedDate, statusFilter);
    }, [fetchMetrics, fetchList, selectedDate, debouncedSearch, statusFilter]);

    useEffect(() => {
        fetchMetrics(selectedDate);
    }, [fetchMetrics, selectedDate]);

    useEffect(() => {
        fetchList(debouncedSearch, selectedDate, statusFilter);
    }, [fetchList, debouncedSearch, selectedDate, statusFilter]);

    // Mở modal & Tải dữ liệu chi tiết đơn
    const handleOpenDetail = async (uuid: string) => {
        setSelectedUuid(uuid);
        setIsModalOpen(true);
        setDetailLoading(true);
        try {
            const detail = await prescriptionDocService.getPrescriptionDetail(uuid);
            setDetailData(detail);
        } catch (err) {
            console.error("Lỗi khi tải chi tiết đơn thuốc:", err);
            setDetailData(null);
        } finally {
            setDetailLoading(false);
        }
    };

    // Xử lý Hủy đơn thuốc
    const handleCancelPrescription = async (data: PrescriptionDetail, reason: string) => {
        await prescriptionDocService.cancelPrescription(data.uuid, { reason });
        setIsModalOpen(false);
        setSelectedUuid(null);
        setDetailData(null);
        reloadData();
    };

    // Render từng hàng trong bảng
    const rows = items.map((item) => {
        const isSelected = selectedUuid === item.uuid;
        const cellStyle = `cursor-pointer transition-colors ${isSelected ? "bg-blue-50/80 text-primary font-medium" : "hover:bg-muted/50"
            }`;

        const renderCell = (content: ReactNode, isFirst = false) => (
            <div
        onClick= {() => setSelectedUuid(isSelected ? null : item.uuid)
}
className = {`-mx-5 -my-4 flex items-center px-5 py-4 ${cellStyle} ${isFirst ? "font-semibold text-foreground" : ""
    }`}
      >
{ content }
    </div>
    );

const formattedDate = item.createdAt
    ? new Date(item.createdAt).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    })
    : "—";

return [
    renderCell(item.rxCode, true),
    renderCell(item.patientName),
    renderCell(formattedDate),
    renderCell(item.medicineCount.toString()),
    renderCell(`${item.totalAmount.toLocaleString("vi-VN")} đ`),
    renderCell(
        <StatusPill tone={ statusToneMap[item.status] || "amber" } >
        { statusLabelMap[item.status] || item.status }
    </StatusPill>
    ),
];
  });

return (
    <div className= "space-y-6" >
    <PortalPageHeader
        eyebrow="Đơn do tôi kê"
title = "Đơn thuốc"
description = "Quản lý đơn thuốc thuộc các ca được phân công; đơn đã thanh toán chỉ được xem."
    />

    <MetricGrid>
    <MetricCard
          label="Đơn tháng này"
value = { metrics?.monthlyCount?.toString() ?? "—"}
detail = {
    metrics?.monthlyDiffFromLastMonth !== undefined
    ? `${metrics.monthlyDiffFromLastMonth >= 0 ? "Tăng" : "Giảm"} ${Math.abs(
        metrics.monthlyDiffFromLastMonth
    )} đơn so với tháng trước`
    : "Đang tải..."
          }
trend = {
    metrics?.monthlyDiffFromLastMonth !== undefined &&
    metrics.monthlyDiffFromLastMonth < 0
    ? "down"
    : "up"
          }
icon = {< Pill className = "size-5" />}
        />
    < MetricCard
label = "Chưa thanh toán"
value = { metrics?.unpaidCount?.toString() ?? "—"}
detail = "Có thể chỉnh sửa hoặc hủy"
icon = {< Clock3 className = "size-5" />}
tone = "amber"
    />
    <MetricCard
          label="Đã thanh toán"
value = { metrics?.paidCount?.toString() ?? "—"}
detail = "Chỉ đọc"
icon = {< CheckCircle2 className = "size-5" />}
tone = "green"
    />
    <MetricCard
          label="Đã hủy"
value = { metrics?.cancelledCount?.toString() ?? "—"}
detail = "Đều có ghi nhận lý do"
icon = {< Activity className = "size-5" />}
tone = "red"
    />
    </MetricGrid>

    < PortalSection title = "Danh sách đơn thuốc" >
    {/* Custom Toolbar */ }
        < div className = "flex flex-wrap items-center justify-between gap-4 border-b p-4" >
            <div className="flex flex-wrap items-center gap-3" >
            {/* Ô tìm kiếm */ }
                < input
type = "text"
placeholder = "Tìm mã đơn hoặc bệnh nhân..."
className = "h-9 w-64 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
value = { searchTerm }
onChange = {(e) => setSearchTerm(e.target.value)}
            />

{/* Bộ chọn ngày cụ thể (mặc định là hôm nay) */ }
<input
              type="date"
className = "h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
value = { selectedDate }
onChange = {(e) => setSelectedDate(e.target.value)}
            />

{/* Lọc trạng thái */ }
<select
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
value = { statusFilter }
onChange = {(e) => setStatusFilter(e.target.value)}
            >
    <option value="Tất cả trạng thái" > Tất cả trạng thái </option>
        < option value = "Unpaid" > Chưa thanh toán </option>
            < option value = "Paid" > Đã thanh toán </option>
                < option value = "Cancelled" > Đã hủy </option>
                    </select>
                    </div>

                    <div>
{/* Nút Xem chi tiết xuất hiện ở góc phải khi chọn 1 hàng */ }
{
    selectedUuid && (
        <PortalAction
                variant="default"
    onClick = {() => handleOpenDetail(selectedUuid)
}
              >
    Xem chi tiết
        </PortalAction>
            )}
</div>
    </div>

{
    listLoading ? (
        <div className= "flex items-center justify-center p-12 text-slate-500 space-x-2" >
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm" > Đang tải danh sách đơn thuốc...</span>
                </div>
        ) : listError ? (
        <div className= "p-8 text-center text-sm text-red-600" > { listError } </div>
        ) : rows.length === 0 ? (
        <div className= "p-8 text-center text-sm text-slate-500" >
        Không tìm thấy đơn thuốc nào trong ngày đã chọn.
          </div>
        ) : (
        <PortalTable
            caption= "Đơn thuốc của bác sĩ"
    columns = {
        [
        "Mã đơn",
        "Bệnh nhân",
        "Ngày kê",
        "Số thuốc",
        "Tổng tiền",
        "Trạng thái",
            ]}
    rows = { rows }
        />
        )
}
</PortalSection>

{/* Cửa sổ Modal Chi tiết đơn thuốc */ }
<PrescriptionDetailModal
        isOpen={ isModalOpen }
data = { detailData }
isLoading = { detailLoading }
onClose = {() => {
    setIsModalOpen(false);
    setDetailData(null);
}}
onCancel = { handleCancelPrescription }
    />
    </div>
  );
}