"use client";

import { useState, useEffect, ReactNode } from "react";
import {
    PortalPageHeader,
    PortalSection,
    PortalTable,
    PortalAction,
    StatusPill,
} from "@/components/internal/portal-ui";
import { MedicineDetailScreen } from "./medicine-detail-screen";
import { MedicineService } from "@/lib/services/medicine/medicine-service";
import { MedicineDto, StockStatusFilter } from "@/types/medicine";
import { useDebounce } from "@/hooks/use-debounce";

export function AvailableMedicineScreen() {

    const [medicines, setMedicines] = useState<MedicineDto[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [dbUnits, setDbUnits] = useState<string[]>([]);
    const [currentTime, setCurrentTime] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 1000);

    const [selectedUnit, setSelectedUnit] = useState<string>("");
    const [selectedStockStatus, setSelectedStockStatus] = useState<
        StockStatusFilter | ""
    >("");

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const now = new Date();
        setCurrentTime(
            now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
        );
    }, []);

    useEffect(() => {
        MedicineService.getMedicineUnits()
            .then((res) => {
                if (Array.isArray(res)) {
                    setDbUnits(res);
                } else if (res && Array.isArray((res as any).Data)) {
                    setDbUnits((res as any).Data);
                } else {
                    setDbUnits([]);
                }
            })
            .catch((err) => {
                console.error("Lỗi tải đơn vị thuốc", err);
                setDbUnits([]);
            });
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const data = await MedicineService.getAvailableMedicines({
                    pageIndex: currentPage,
                    pageSize: ITEMS_PER_PAGE,
                    search: debouncedSearch,
                    unit: selectedUnit || undefined,
                    stockStatus: selectedStockStatus
                        ? (Number(selectedStockStatus) as StockStatusFilter)
                        : undefined,
                });
                setMedicines(data?.items || []);
                setTotalPages(data?.totalPages || 1);
                setTotalCount(data?.totalCount || 0);

                setSelectedId(null);
            } catch (error) {
                console.error("Lỗi tải danh sách thuốc", error);
                setMedicines([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [currentPage, debouncedSearch, selectedUnit, selectedStockStatus]);

    const renderStatus = (status: StockStatusFilter) => {
        switch (status) {
            case 1:
                return <StatusPill tone="green" > Còn hàng </StatusPill>;
            case 2:
                return <StatusPill tone="amber" > Sắp hết </StatusPill>;
            case 3:
                return <StatusPill tone="red" > Hết hàng </StatusPill>;
            default:
                return null;
        }
    };

    const rows = (medicines || []).map((med) => {
        const isSelected = selectedId === med.uuid;
        const cellStyle = `cursor-pointer transition-colors ${isSelected ? "bg-blue-50/80 text-primary font-medium" : "hover:bg-muted/50"
            }`;

        const renderCell = (content: ReactNode, isFirst = false) => (
            <div
        onClick= {() => setSelectedId(med.uuid)
}
className = {`-mx-5 -my-4 flex items-center px-5 py-4 ${cellStyle} ${isFirst ? "font-semibold text-foreground" : ""
    }`}
      >
{ content }
    </div>
    );

return [
    renderCell(med.name, true),
    renderCell(med.unit),
    renderCell(`${med.price.toLocaleString("vi-VN")} đ`),
    renderCell(med.stock.toString()),
    renderCell(med.minStock.toString()),
    renderCell(renderStatus(med.status)),
];
  });

return (
    <div className= "space-y-6" >
    <PortalPageHeader
        eyebrow="Tra cứu tại chi nhánh"
title = "Thuốc khả dụng"
description = "Thông tin số lượng chỉ hỗ trợ kê đơn; bác sĩ không có quyền điều chỉnh tồn kho."
    />

    <PortalSection
        title="Danh mục khả dụng"
description = {
    currentTime
    ? `Tồn kho cập nhật lúc ${currentTime}`
            : "Đang cập nhật..."
        }
      >
{/* Custom Toolbar */ }
    < div className = "flex flex-wrap items-center justify-between gap-4 border-b p-4" >
        <div className="flex flex-wrap items-center gap-3" >
            <input
              type="text"
placeholder = "Tìm tên thuốc..."
className = "h-9 w-64 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
value = { searchTerm }
onChange = {(e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset page khi tìm kiếm
}}
            />

    < select
className = "h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
value = { selectedUnit }
onChange = {(e) => {
    setSelectedUnit(e.target.value);
    setCurrentPage(1);
}}
            >
    <option value="" > Tất cả đơn vị </option>
{
    Array.isArray(dbUnits) &&
    dbUnits.map((unit) => (
        <option key= { unit } value = { unit } >
        { unit }
        </option>
    ))
}
</select>

    < select
className = "h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
value = { selectedStockStatus }
onChange = {(e) => {
    setSelectedStockStatus(
        e.target.value as unknown as StockStatusFilter
    );
    setCurrentPage(1);
}}
            >
    <option value="" > Tất cả mức tồn </option>
        < option value = { StockStatusFilter.InStock } > Còn hàng </option>
            < option value = { StockStatusFilter.LowStock } > Sắp hết </option>
                < option value = { StockStatusFilter.OutOfStock } > Hết hàng </option>
                    </select>
                    </div>

                    <div>
{/* Chỉ hiển thị nút khi đã chọn 1 hàng */ }
{
    selectedId && (
        <PortalAction
                variant="default"
    onClick = {() => setIsSheetOpen(true)
}
              >
    Xem chi tiết
        </PortalAction>
            )}
</div>
    </div>

{/* Phân trang UI: Tự động ẩn nút/thanh điều hướng khi không cần thiết */ }
{
    totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 border-b bg-slate-50/50 px-4 py-2 select-none" >
        { currentPage > 1 && (
                <button
                type="button"
    onClick = {() => setCurrentPage((prev) => Math.max(prev - 1, 1))
}
disabled = { isLoading }
className = "inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-blue-600 active:scale-95 disabled:opacity-50"
    >
    <span>& larr; </span>
        < span > Trang trước </span>
            </button>
            )}

<span className="px-2 text-xs font-medium text-slate-600" >
    Trang { currentPage } / {totalPages}
        </span>

{
    currentPage < totalPages && (
        <button
                type="button"
    onClick = {() =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
}
disabled = { isLoading }
className = "inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-blue-600 active:scale-95 disabled:opacity-50"
    >
    <span>Trang sau </span>
        <span> & rarr; </span>
            </button>
            )}
</div>
        )}

<PortalTable
          caption={
    isLoading
        ? "Đang tải dữ liệu..."
        : `Hiển thị ${(medicines || []).length} / ${totalCount} thuốc`
}
columns = {
    [
    "Tên thuốc",
    "Đơn vị",
    "Giá",
    "Số lượng",
    "Mức tối thiểu",
    "Khả dụng",
          ]}
rows = { rows }
    />
    </PortalSection>

    < MedicineDetailScreen
medicineId = { selectedId }
isOpen = { isSheetOpen }
onClose = {() => setIsSheetOpen(false)}
      />
    </div>
  );
}