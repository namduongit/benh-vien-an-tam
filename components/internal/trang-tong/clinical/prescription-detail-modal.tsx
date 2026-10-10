"use client";

import { useState } from "react";
import { StatusPill } from "@/components/internal/portal-ui";
import {
    X,
    FileText,
    User,
    Stethoscope,
    Pill,
    AlertCircle,
    Pencil,
    Ban,
    Eye,
    ShieldCheck,
    Loader2,
    AlertTriangle,
} from "lucide-react";
import type { PrescriptionDetail } from "@/types/prescription-doc";

export interface PrescriptionDetailModalProps {
    isOpen: boolean;
    data?: PrescriptionDetail | null;
    isLoading?: boolean;
    onClose: () => void;
    onEdit?: (data: PrescriptionDetail) => void;
    onCancel?: (data: PrescriptionDetail, reason: string) => Promise<void> | void;
    onViewAppointment?: (appointmentUuid: string) => void;
}

export function PrescriptionDetailModal({
    isOpen,
    data,
    isLoading = false,
    onClose,
    onEdit,
    onCancel,
    onViewAppointment,
}: PrescriptionDetailModalProps) {
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [isCancelling, setIsCancelling] = useState(false);

    if (!isOpen) return null;

    const handleConfirmCancel = async () => {
        if (!data) return;
        try {
            setIsCancelling(true);
            await onCancel?.(data, cancelReason.trim() || "Bác sĩ hủy đơn thuốc");
            setShowCancelConfirm(false);
            setCancelReason("");
        } catch (error) {
            console.error("Lỗi khi hủy đơn thuốc:", error);
        } finally {
            setIsCancelling(false);
        }
    };

    const handleCloseModal = () => {
        setShowCancelConfirm(false);
        setCancelReason("");
        onClose();
    };

    const hasPatientInsurance = Boolean(
        data?.patient?.insuranceCode && data.patient.insuranceCode.trim() !== ""
    );

    const totalPrice =
        data?.details
            ?.filter((item) => !item.isExternal)
            .reduce((sum, item) => sum + item.price * item.quantity, 0) ?? 0;

    return (
        <div className= "fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" >
        <div className="relative flex flex-col w-full max-w-4xl h-full max-h-[85vh] rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" >

        {/* Header Modal */ }
            < div className = "flex-none flex items-center justify-between border-b bg-slate-50/80 px-6 py-4" >
                <div className="flex items-center gap-3" >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600" >
                        <FileText className="h-5 w-5" />
                            </div>
                            < div >
                            <div className="flex items-center gap-2" >
                                <h3 className="text-lg font-bold text-slate-800" >
                                    Chi tiết đơn thuốc: { data?.rxCode || "..." }
    </h3>
    {
        data?.status === "Paid" && (
            <StatusPill tone="green" > Đã thanh toán </StatusPill>
                )
    }
    {
        data?.status === "Unpaid" && (
            <StatusPill tone="amber" > Chưa thanh toán </StatusPill>
                )
    }
    {
        data?.status === "Cancelled" && (
            <StatusPill tone="red" > Đã hủy </StatusPill>
                )
    }
    </div>
    {
        data?.createdAt && (
            <p className="text-xs text-slate-500" > Kê đơn lúc: { data.createdAt } </p>
              )
    }
    </div>
        </div>

    {/* Nút đóng duy nhất góc trên phải */ }
    <button
            type="button"
    onClick = { handleCloseModal }
    title = "Đóng cửa sổ"
    className = "rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
        >
        <X className="h-5 w-5" />
            </button>
            </div>

    {/* Thân Modal */ }
    {
        isLoading ? (
            <div className= "flex-1 flex flex-col items-center justify-center p-12 space-y-3" >
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm text-slate-500" > Đang tải chi tiết đơn thuốc...</p>
                    </div>
        ) : !data ? (
            <div className= "flex-1 flex items-center justify-center p-12 text-slate-500" >
            Không tìm thấy dữ liệu đơn thuốc.
          </div>
        ) : (
            <div className= "flex-1 min-h-0 overflow-y-auto p-6 space-y-6" >

            {/* 1. Thông tin bệnh nhân & Mã BHYT */ }
            < div className = "rounded-lg border border-slate-200 bg-slate-50/50 p-4" >
                <div className="mb-3 flex items-center gap-2 font-semibold text-slate-700" >
                    <User className="h-4 w-4 text-blue-600" />
                        <span>Thông tin bệnh nhân </span>
                            </div>
                            < div className = "grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 md:grid-cols-5" >
                                <div>
                                <span className="block text-xs text-slate-500" > Mã bệnh nhân </span>
                                    < span className = "font-semibold text-slate-800" >
                                    { data.patient.medicalCode }
                                        </span>
                                        </div>
                                        < div >
                                        <span className="block text-xs text-slate-500" > Mã BHYT </span>
        {
            hasPatientInsurance ? (
                <span className= "inline-flex items-center gap-1 font-semibold text-blue-700" >
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                { data.patient.insuranceCode }
                    </span>
                  ) : (
                <span className= "font-medium text-slate-400" > Không có </span>
                  )
        }
        </div>
            < div >
            <span className="block text-xs text-slate-500" > Họ và tên </span>
                < span className = "font-semibold text-slate-800" >
                { data.patient.name }
                    </span>
                    </div>
                    < div >
                    <span className="block text-xs text-slate-500" > Giới tính </span>
                        < span className = "text-slate-800" > { data.patient.gender } </span>
                            </div>
                            < div >
                            <span className="block text-xs text-slate-500" > Ngày sinh / Tuổi </span>
                                < span className = "text-slate-800" > { data.patient.birthdate } </span>
                                    </div>
                                    </div>
                                    </div>

        {/* 2. Thông tin ca khám & Chẩn đoán */ }
        <div className="rounded-lg border border-slate-200 p-4 space-y-3" >
            <div className="flex items-center justify-between border-b pb-2" >
                <div className="flex items-center gap-2 font-semibold text-slate-700" >
                    <Stethoscope className="h-4 w-4 text-blue-600" />
                        <span>Thông tin ca khám & Chẩn đoán </span>
                            </div>

        {
            data.appointment?.uuid && (
                <button
                    type="button"
            onClick = {() => onViewAppointment?.(data.appointment!.uuid)
        }
        className = "inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm hover:bg-slate-100 hover:text-blue-600 transition-colors"
            >
            <Eye className="h-3 w-3 text-slate-500" />
                <span>Xem chi tiết ca khám </span>
                    </button>
                )
    }
    </div>

        < div className = "grid grid-cols-2 gap-3 rounded-md bg-slate-50/60 p-3 text-xs md:grid-cols-4 border border-slate-100" >
            <div>
            <span className="block text-slate-500" > Mã ca khám </span>
                < span className = "font-semibold text-slate-800" >
                { data.appointment?.code || data.appointment?.uuid || "—" }
                    </span>
                    </div>
                    < div >
                    <span className="block text-slate-500" > Loại lịch khám </span>
                        < span className = "inline-block mt-0.5 rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 font-medium text-blue-700" >
                        { data.appointment?.type || "Khám thường" }
                            </span>
                            </div>
                            < div >
                            <span className="block text-slate-500" > Thời gian khám </span>
                                < span className = "font-medium text-slate-800" >
                                { data.appointment?.time || "Theo lịch hẹn" }
                                    </span>
                                    </div>
                                    < div >
                                    <span className="block text-slate-500" > Phòng khám </span>
                                        < span className = "font-medium text-slate-800" >
                                        { data.appointment?.roomName || "Chưa xếp phòng" }
                                            </span>
                                            </div>
                                            </div>

                                            < div >
                                            <span className="block text-xs font-medium text-slate-500 mb-1" >
                                                Chẩn đoán của bác sĩ:
    </span>
        < div className = "rounded-md bg-amber-50/60 p-3 border border-amber-200/60" >
            <p className="text-sm text-slate-800 font-medium" >
            { data.appointment?.doctorNote || "Chưa có ghi nhận chẩn đoán." }
                </p>
                </div>
                </div>
                </div>

    {/* 3. Danh sách thuốc chỉ định */ }
    <div className="space-y-3" >
        <div className="flex items-center justify-between" >
            <div className="flex items-center gap-2 font-semibold text-slate-700" >
                <Pill className="h-4 w-4 text-blue-600" />
                    <span>Danh mục thuốc chỉ định </span>
                        </div>
                        < span className = "text-xs text-slate-500" >
                            Tổng: { data.details?.length || 0 } loại thuốc
                                </span>
                                </div>

                                < div className = "overflow-x-auto rounded-lg border border-slate-200" >
                                    <table className="w-full text-left text-sm text-slate-600" >
                                        <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase border-b sticky top-0 z-10" >
                                            <tr>
                                            <th className="px-4 py-3" > Tên thuốc </th>
                                                < th className = "px-3 py-3 text-center" > Đơn vị </th>
                                                    < th className = "px-3 py-3 text-center" > Số lượng </th>
                                                        < th className = "px-3 py-3 text-center" > Mức giảm BHYT </th>
                                                            < th className = "px-4 py-3" > Liều dùng & Cách dùng </th>
                                                                < th className = "px-4 py-3 text-right" > Đơn giá </th>
                                                                    < th className = "px-4 py-3 text-right" > Thành tiền </th>
                                                                        </tr>
                                                                        </thead>
                                                                        < tbody className = "divide-y divide-slate-200 bg-white" >
                                                                        {
                                                                            data.details?.map((item, idx) => {
                                                                                const lineTotal = item.price * item.quantity;
                                                                                const discountPercent =
                                                                                    hasPatientInsurance && !item.isExternal && item.isInsured
                                                                                        ? item.insuranceCap ?? 0
                                                                                        : 0;

                                                                                return (
                                                                                    <tr key= { idx } className = "hover:bg-slate-50/80" >
                                                                                        <td className="px-4 py-3" >
                                                                                            <div className="font-medium text-slate-800" >
                                                                                            { item.medicineName }
                                                                                                </div>
                                                                                {
                                                                                    item.isExternal && (
                                                                                        <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-amber-700 bg-amber-50/90 px-1 py-0.5 rounded border border-amber-200 mt-1" >
                                                                                            <AlertCircle className="h-2 w-2 text-amber-600" /> Thuốc mua ngoài
                                                                                                </span>
                            )
                                                                        }
                                                                            </td>
                                                                            < td className = "px-3 py-3 text-center text-xs" > { item.unit } </td>
                                                                                < td className = "px-3 py-3 text-center font-semibold text-slate-800" >
                                                                                { item.quantity }
                                                                                    </td>

                                                                                    < td className = "px-3 py-3 text-center text-xs" >
                                                                                    { discountPercent > 0 ? (
                                                                                        <span className= "inline-block rounded bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 border border-emerald-200" >
                                                                                    { discountPercent } %
                                                                                    </span>
                            ) : (
        <span className= "text-slate-400 font-medium" > 0 % </span>
                            )
}
</td>

    < td className = "px-4 py-3 text-xs" >
        <div className="text-slate-800 font-medium" >
        { item.quantityPerDose } { item.unit } /lần × {item.dosesPerDay} lần/ngày({ item.duration } ngày)
            </div>
            < div className = "text-slate-500 italic mt-0.5" >
                HD: { item.note }
</div>
    </td>
    < td className = "px-4 py-3 text-right text-xs" >
    { item.isExternal ? "-" : `${item.price.toLocaleString("vi-VN")} đ` }
        </td>
        < td className = "px-4 py-3 text-right font-medium text-slate-800" >
        { item.isExternal ? "0 đ" : `${lineTotal.toLocaleString("vi-VN")} đ` }
            </td>
            </tr>
                      );
                    })}
</tbody>
    </table>
    </div>
    </div>

{/* 4. Ghi chú dặn dò & Tổng tiền */ }
<div className="flex flex-col md:flex-row gap-4 items-start justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-4" >
    <div className="space-y-1 max-w-lg" >
        <span className="text-xs font-semibold text-slate-600" >
            Ghi chú / Dặn dò của bác sĩ:
</span>
    < p className = "text-sm text-slate-700 italic" >
        "{data.note || "Không có ghi chú thêm."}"
            </p>
            </div>

            < div className = "w-full md:w-auto text-right space-y-1 border-t md:border-t-0 pt-3 md:pt-0" >
                <div className="text-xs text-slate-500" > Tổng tiền đơn thuốc: </div>
                    < div className = "text-xl font-bold text-blue-600" >
                    { totalPrice.toLocaleString("vi-VN") } đ
                        </div>
                        < div className = "text-[11px] text-slate-400" >
                            (Không bao gồm các thuốc mua ngoài)
</div>
    </div>
    </div>
    </div>
        )}

{/* Footer Modal: Chỉ hiển thị nút Hủy & Chỉnh sửa khi đơn CHƯA THANH TOÁN */ }
{
    data?.status === "Unpaid" && !isLoading && (
        <div className="flex-none border-t bg-slate-50 px-6 py-3" >
        {
            showCancelConfirm?(
              <div className = "flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50/80 p-3 animate-in fade-in duration-150" >
                    <div className="flex items-center gap-2 text-xs font-bold text-red-800">
            <AlertTriangle className="h-4 w-4 text-red-600" />
                <span>Xác nhận hủy đơn thuốc { data.rxCode }?</span>
                    </div>
                    < input
    type = "text"
    placeholder = "Nhập lý do hủy đơn (không bắt buộc)..."
    className = "h-8 w-full rounded-md border border-red-300 bg-white px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500"
    value = { cancelReason }
    onChange = {(e) => setCancelReason(e.target.value)
}
                />
    < div className = "flex items-center justify-end gap-2 mt-1" >
        <button
                    type="button"
disabled = { isCancelling }
onClick = {() => setShowCancelConfirm(false)}
className = "rounded px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors"
    >
    Hủy bỏ
        </button>
        < button
type = "button"
disabled = { isCancelling }
onClick = { handleConfirmCancel }
className = "inline-flex items-center gap-1 rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-red-700 transition-colors disabled:opacity-50"
    >
{ isCancelling && <Loader2 className="h-3 w-3 animate-spin" />}
<span>Đồng ý hủy đơn </span>
    </button>
    </div>
    </div>
            ) : (
    <div className= "flex items-center justify-end gap-2" >
    <button
                  type="button"
onClick = {() => setShowCancelConfirm(true)}
className = "inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-100 transition-colors"
    >
    <Ban className="h-3.5 w-3.5" />
        <span>Hủy đơn </span>
            </button>

            < button
type = "button"
onClick = {() => onEdit?.(data)}
className = "inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 shadow-sm hover:bg-blue-100 transition-colors"
    >
    <Pencil className="h-3.5 w-3.5" />
        <span>Chỉnh sửa </span>
            </button>
            </div>
            )}
</div>
        )}
</div>
    </div>
  );
}