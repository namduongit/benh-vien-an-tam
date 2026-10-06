"use client";
import { useEffect, useState } from "react";
import { Pill, ShieldCheck, Warehouse } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { StatusPill } from "@/components/internal/portal-ui";
import { MedicineService } from "@/lib/services/medicine/medicine-service";
import { MedicineDetailDto } from "@/types/medicine";

interface MedicineDetailScreenProps {
    medicineId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export function MedicineDetailScreen({
    medicineId,
    isOpen,
    onClose,
}: MedicineDetailScreenProps) {
    const [detail, setDetail] = useState<MedicineDetailDto | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch API khi mở sheet[cite: 3]
    useEffect(() => {
        if (isOpen && medicineId) {
            setIsLoading(true);
            MedicineService.getMedicineDetail(medicineId)
                .then(setDetail)
                .catch(console.error)
                .finally(() => setIsLoading(false));
        } else {
            setDetail(null); // Clear data khi đóng
        }
    }, [isOpen, medicineId]);

    if (!isOpen) return null;

    const renderStatus = (status: number) => {
        switch (status) {
            case 1: return <StatusPill tone="green" > Còn hàng </StatusPill>;
            case 2: return <StatusPill tone="amber" > Sắp hết </StatusPill>;
            case 3: return <StatusPill tone="red" > Hết hàng </StatusPill>;
            default: return null;
        }
    };

    return (
        <Sheet open= { isOpen } onOpenChange = {(open) => !open && onClose()
}>
    <SheetContent className="w-full overflow-y-auto sm:max-w-lg p-6" >
    { isLoading || !detail ? (
        <div className= "flex h-full items-center justify-center" >
    <span className="text-sm text-muted-foreground" > Đang tải dữ liệu...</span>
        </div>
        ) : (
    <>
    {/* HEADER SHEET */ }
    < SheetHeader className = "border-b pb-4 pr-6" >
        <div className="flex items-start justify-between gap-3" >
            <div>
            <div className="flex items-center gap-2" >
                <SheetTitle className="text-xl font-bold text-[#173b57]" >
                { detail.name }
                    </SheetTitle>
{ renderStatus(detail.status) }
</div>
    < SheetDescription className = "mt-1 text-xs text-muted-foreground" >
        Mã tra cứu: { " " }
<span className="font-mono font-semibold text-foreground" >
{ detail.uuid }
    </span>
    </SheetDescription>
    </div>
    </div>
    </SheetHeader>

    < div className = "mt-6 space-y-5" >
    {/* KHUNG HÌNH ẢNH SẢN PHẨM */ }
        < div className = "relative flex h-48 w-full items-center justify-center overflow-hidden rounded-xl border bg-slate-50" >
            {
                detail.imageUrl ? (
                    <img
                    src= { detail.imageUrl }
                    alt={ detail.name }
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
                ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-400" >
                <Pill className="h-10 w-10 stroke-[1.5]" />
                <span className="text-xs font-medium" > Chưa có hình ảnh </span>
                </div>
                )}
</div>

{/* KHUNG THÔNG TIN TỒN KHO & GIÁ */ }
<div className="rounded-xl border bg-slate-50/50 p-4" >
    <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#173b57]" >
        <Warehouse className="h-4 w-4 text-primary" />
            <span>Thông tin tồn kho & Giá </span>
                </div>
                < div className = "grid grid-cols-2 gap-4" >
                    <div className="space-y-0.5" >
                        <span className="text-[11px] font-medium uppercase text-muted-foreground" >
                            Đơn giá bán
                                </span>
                                < p className = "text-base font-semibold text-primary" >
                                { detail.price.toLocaleString("vi-VN") } đ
                                    </p>
                                    </div>
                                    < div className = "space-y-0.5" >
                                        <span className="text-[11px] font-medium uppercase text-muted-foreground" >
                                            Đơn vị tính
                                                </span>
                                                < p className = "text-sm font-medium text-foreground" >
                                                { detail.unit }
                                                    </p>
                                                    </div>
                                                    < div className = "space-y-0.5" >
                                                        <span className="text-[11px] font-medium uppercase text-muted-foreground" >
                                                            Số lượng tồn kho
                                                                </span>
                                                                < p className = "text-sm font-medium text-foreground" >
                                                                { detail.stock } { detail.unit }
</p>
    </div>
    < div className = "space-y-0.5" >
        <span className="text-[11px] font-medium uppercase text-muted-foreground" >
            Mức tồn tối thiểu
                </span>
                < p className = "text-sm font-medium text-foreground" >
                { detail.minStock } { detail.unit }
</p>
    </div>
    </div>
    </div>

{/* KHUNG BẢO HIỂM Y TẾ */ }
<div className="rounded-xl border bg-slate-50/50 p-4" >
    <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#173b57]" >
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Chính sách Bảo Hiểm Y Tế </span>
                </div>
                < div className = "grid grid-cols-2 gap-4 items-center" >
                    <div className="space-y-1" >
                        <span className="text-[11px] font-medium uppercase text-muted-foreground block" >
                            Hỗ trợ BHYT
                                </span>
{
    detail.isInsured ? (
        <StatusPill tone= "green" > Có áp dụng </StatusPill>
                    ) : (
        <StatusPill tone= "neutral" > Không áp dụng </StatusPill>
                    )
}
</div>
    < div className = "space-y-0.5" >
        <span className="text-[11px] font-medium uppercase text-muted-foreground" >
            Mức thanh toán BHYT
                </span>
                < p className = "text-sm font-semibold text-foreground" >
                { detail.insuranceCap || "0%" }
                    </p>
                    </div>
                    </div>
                    </div>

{/* KHUNG MÔ TẢ & CHỈ ĐỊNH */ }
{
    detail.description && (
        <div className="space-y-2" >
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground" >
                Mô tả & Chỉ định y khoa
                    </h4>
                    < p className = "rounded-xl border bg-slate-50/50 p-3.5 text-xs leading-relaxed text-slate-700" >
                    { detail.description }
                        </p>
                        </div>
              )
}
</div>
    </>
        )}
</SheetContent>
    </Sheet>
  );
}