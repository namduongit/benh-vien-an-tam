"use client";

import {
    ArrowLeft,
    CheckCircle2,
    FilePlus2,
    FlaskConical,
    Play,
    Plus,
    Save,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import {
    DetailGrid,
    DetailItem,
    PortalAction,
    PortalPageHeader,
    PortalSection,
    StatusPill,
} from "@/components/internal/portal-ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getVietnamDateTimeParts } from "@/lib/booking/working-hours";
import { doctorAppointmentService } from "@/lib/services/appointment/doctorAppointmentService";
import { clinicalExaminationService } from "@/lib/services/appointment/clinicalExaminationService";
import { prescriptionService } from "@/lib/services/appointment/prescriptionService";
import { cn } from "@/lib/utils";
import type {
    ClinicalAppointment,
    ClinicalCaseDetail,
    ClinicalMedicalService,
    ClinicalMedicineOption,
} from "@/types/internal-clinical";

type DetailState =
    | { status: "loading" }
    | { status: "success"; item: ClinicalCaseDetail }
    | { status: "error"; message: string };

const statusLabels: Record<string, string> = {
    Approved: "Đã xác nhận",
    Pending: "Chờ xác nhận",
    Unconfirmed: "Không xác nhận",
    CheckedIn: "Đang khám",
    Done: "Đã hoàn thành",
    Cancelled: "Đã hủy",
};

const statusTones: Record<string, "amber" | "blue" | "green" | "red"> = {
    Approved: "blue",
    Pending: "amber",
    Unconfirmed: "red",
    CheckedIn: "blue",
    Done: "green",
    Cancelled: "red",
};

const prescriptionStatusToneMap: Record<string, "amber" | "green" | "red"> = {
    Unpaid: "amber",
    Paid: "green",
    Cancelled: "red",
};

const prescriptionStatusLabelMap: Record<string, string> = {
    Unpaid: "Chưa thanh toán",
    Paid: "Đã thanh toán",
    Cancelled: "Đã hủy",
};

export function AssignedCaseDetailScreen({ uuid }: { uuid: string }) {
    const [state, setState] = useState<DetailState>({ status: "loading" });
    const [selectedService, setSelectedService] = useState("");
    const [serviceError, setServiceError] = useState("");
    const [isAddingService, setIsAddingService] = useState(false);

    const [diagnosisNote, setDiagnosisNote] = useState("");

    // Tìm kiếm thuốc với debounce
    const [medicineSearch, setMedicineSearch] = useState("");
    const [debouncedMedicineSearch, setDebouncedMedicineSearch] = useState("");
    const [searchedMedicines, setSearchedMedicines] = useState<ClinicalMedicineOption[]>([]);
    const [selectedMedicine, setSelectedMedicine] = useState<ClinicalMedicineOption | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [quantity, setQuantity] = useState("10");
    const [quantityPerDose, setQuantityPerDose] = useState("1");
    const [dosesPerDay, setDosesPerDay] = useState("2");
    const [duration, setDuration] = useState("5");
    const [usageNote, setUsageNote] = useState("Uống sau ăn sáng và tối");

    const [prescriptionItems, setPrescriptionItems] = useState<Array<{
        medicineUuid: string;
        medicineName: string;
        unit: string;
        quantity: number;
        quantityPerDose: number;
        dosesPerDay: number;
        duration: number;
        note: string;
    }>>([]);
    const [prescriptionNote, setPrescriptionNote] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedMedicineSearch(medicineSearch);
        }, 1200);
        return () => clearTimeout(timer);
    }, [medicineSearch]);

    useEffect(() => {
        const controller = new AbortController();
        if (debouncedMedicineSearch.trim()) {
            clinicalExaminationService
                .searchMedicines(debouncedMedicineSearch, controller.signal)
                .then((res) => setSearchedMedicines(res))
                .catch(() => setSearchedMedicines([]));
        } else {
            setSearchedMedicines([]);
        }
        return () => controller.abort();
    }, [debouncedMedicineSearch]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const loadDetail = () => {
        const controller = new AbortController();
        doctorAppointmentService
            .getAppointmentDetail(uuid, controller.signal)
            .then((item) => {
                setState({ status: "success", item });
                if (item.DoctorNote) setDiagnosisNote(item.DoctorNote);
                if (item.Prescription) {
                    setPrescriptionNote(item.Prescription.Note ?? "");
                    setPrescriptionItems(
                        item.Prescription.Details.map((d) => ({
                            medicineUuid: d.MedicineUuid,
                            medicineName: d.MedicineName,
                            unit: d.Unit,
                            quantity: d.Quantity,
                            quantityPerDose: d.QuantityPerDose,
                            dosesPerDay: d.DosesPerDay,
                            duration: d.Duration,
                            note: d.Note,
                        }))
                    );
                }
            })
            .catch((error: unknown) => {
                if (!controller.signal.aborted) {
                    setState({
                        status: "error",
                        message: error instanceof Error ? error.message : "Không thể tải ca khám.",
                    });
                }
            });
        return () => controller.abort();
    };

    useEffect(() => {
        loadDetail();
    }, [uuid]);

    if (state.status === "loading") {
        return <p className="border bg-white p-8 text-center text-sm text-muted-foreground" > Đang tải thông tin ca khám...</p>;
    }

    if (state.status === "error") {
        return (
            <div className= "space-y-4 border bg-white p-8 text-center" >
            <p className="text-sm text-destructive" > { state.message } </p>
                < Link href = "/noi-bo/trang-tong/lich-kham" className = { buttonVariants({ variant: "outline" }) } >
                    <ArrowLeft aria-hidden="true" /> Quay lại lịch khám
                        </Link>
                        </div>
        );
    }

    const item = state.item;
    const dateTime = formatDateTime(item.AppointmentAt);

    const isApproved = item.Status === "Approved";
    const isCheckedIn = item.Status === "CheckedIn";
    const isDone = item.Status === "Done";
    const prescriptionStatus = item.Prescription?.Status ?? "Unpaid";

    async function handleStartAppointment() {
        await doctorAppointmentService.updateStatus(item.Uuid, "CheckedIn");
        loadDetail();
    }

    async function handleCancelAppointment() {
        if (window.confirm("Bạn có chắc chắn muốn hủy ca khám này không?")) {
            await doctorAppointmentService.updateStatus(item.Uuid, "Cancelled");
            loadDetail();
        }
    }

    async function handleCompleteAppointment() {
        try {
            await doctorAppointmentService.updateStatus(item.Uuid, "Done");
            loadDetail();
        } catch (err: any) {
            alert(err?.response?.data?.Message || "Không thể hoàn thành ca khám.");
        }
    }

    async function addMedicalService() {
        if (!selectedService) return;
        setIsAddingService(true);
        setServiceError("");
        try {
            const service = await clinicalExaminationService.addService(item.Uuid, selectedService);
            setState({
                status: "success",
                item: {
                    ...item,
                    MedicalServices: [...item.MedicalServices, service],
                },
            });
            setSelectedService("");
        } catch (error) {
            setServiceError(error instanceof Error ? error.message : "Không thể thêm dịch vụ.");
        } finally {
            setIsAddingService(false);
        }
    }

    async function handleSaveDiagnosis() {
        try {
            await clinicalExaminationService.saveDiagnosis(item.Uuid, diagnosisNote);
            alert("Đã lưu chẩn đoán thành công!");
        } catch (error: any) {
            alert(error?.response?.data?.Message || "Lưu chẩn đoán thất bại.");
        }
    }

    async function handleSavePrescription() {
        try {
            await prescriptionService.savePrescription(
                item.Uuid,
                prescriptionNote,
                prescriptionItems.map((p) => ({
                    MedicineUuid: p.medicineUuid,
                    Quantity: p.quantity,
                    QuantityPerDose: p.quantityPerDose,
                    DosesPerDay: p.dosesPerDay,
                    Duration: p.duration,
                    Note: p.note,
                }))
            );
            alert("Lưu đơn thuốc thành công!");
            loadDetail();
        } catch (error: any) {
            alert(error?.response?.data?.Message || "Lưu đơn thuốc thất bại.");
        }
    }

    function updateMedicalService(updatedService: ClinicalMedicalService) {
        setState({
            status: "success",
            item: {
                ...item,
                MedicalServices: item.MedicalServices.map((current) =>
                    current.Uuid === updatedService.Uuid ? updatedService : current
                ),
            },
        });
    }

    return (
        <div className= "space-y-6 max-w-5xl mx-auto" >
        <Link
                href="/noi-bo/trang-tong/lich-kham"
    className = { cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")
}
            >
    <ArrowLeft aria-hidden="true" /> Lịch khám của tôi
        </Link>

        < PortalPageHeader
title = { item.PatientName }
description = {`Mã y tế ${item.MedicalCode} · ${genderLabel(item.Gender)} · Lịch được phân công trực tiếp cho bạn.`}
actions = {
    isApproved?(
                        <>
    <PortalAction variant="default" onClick = { handleStartAppointment } >
        <Play className="size-4 mr-1" /> Bắt đầu ca khám
            </PortalAction>
            < PortalAction onClick = { handleCancelAppointment } > Hủy ca </PortalAction>
                </>
                    ) : isCheckedIn ? (
    <>
    <PortalAction onClick= { handleCancelAppointment } > Hủy ca </PortalAction>
        < PortalAction variant = "default" onClick = { handleCompleteAppointment } >
            <CheckCircle2 className="size-4 mr-1" /> Hoàn thành ca
                </PortalAction>
                </>
                    ) : null
                }
            />

    < div className = "space-y-6" >
    {/* 1. Thông tin lượt khám */ }
        < PortalSection title = "Thông tin lượt khám" >
            <DetailGrid>
            <DetailItem label="Thời gian" value = {`${dateTime.time} · ${dateTime.date}`} />
                < DetailItem label = "Phòng" value = { item.RoomName } />
                    <DetailItem label="Loại lịch" value = { item.TypeLabel } />
                        <DetailItem
                            label="Trạng thái"
value = {
                                < StatusPill tone = { statusTones[item.Status] ?? "blue" } >
{ statusLabels[item.Status] ?? item.Status }
    </StatusPill>
                            }
                        />
    < DetailItem label = "Ghi chú đặt lịch" value = { item.Note || "Không có ghi chú" } />
        <DetailItem label="UUID lịch" value = { item.Uuid } />
            </DetailGrid>
            </PortalSection>

{/* 2. Dịch vụ khám được chỉ định */ }
<PortalSection
                    title="Dịch vụ khám được chỉ định"
description = "Theo dõi kết quả X-quang, nội soi, xét nghiệm và các dịch vụ cận lâm sàng."
    >
    <div className="space-y-4 p-5" >
    { isCheckedIn && (
            <div className="flex flex-col gap-3 sm:flex-row" >
                <label className="min-w-0 flex-1" >
                    <span className="sr-only" > Chọn dịch vụ khám </span>
                        < select
value = { selectedService }
onChange = {(event) => setSelectedService(event.target.value)}
className = "h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
    >
    <option value="" > Chọn dịch vụ cần chỉ định </option>
{
    item.AvailableMedicalServices.map((service) => (
        <option key= { service.Uuid } value = { service.Uuid } >
        { service.Name } · { formatPrice(service.Price)
}
</option>
                                        ))}
</select>
    </label>
    < Button
type = "button"
onClick = { addMedicalService }
disabled = {!selectedService || isAddingService}
                                >
    <Plus aria-hidden="true" />
    { isAddingService? "Đang thêm...": "Thêm chỉ định" }
        </Button>
        </div>
                        )}
{ serviceError ? <p className="text-sm text-destructive" > { serviceError } </p> : null }

{
    item.MedicalServices.length ? (
        <div className= "space-y-3" >
        {
            item.MedicalServices.map((service) => (
                <MedicalServiceResult
                                        key= { service.Uuid }
                                        appointmentUuid = { item.Uuid }
                                        service = { service }
                                        canEdit = { isCheckedIn }
                                        onUpdate = { updateMedicalService }
                />
                                ))
        }
        </div>
                        ) : (
        <div className= "border border-dashed p-5 text-center text-sm text-muted-foreground" >
        Không có dịch vụ khám được chỉ định.
                            </div>
                        )
}
</div>
    </PortalSection>

{/* 3. Thông tin chẩn đoán */ }
<PortalSection
                    title="Thông tin chẩn đoán"
description = "Ghi nhận kết luận chẩn đoán bệnh cho bệnh nhân."
    >
    <div className="p-5 space-y-3" >
        <Label htmlFor="diagnosis-textarea" > Kết luận chẩn đoán của bác sĩ </Label>
            < Textarea
id = "diagnosis-textarea"
rows = { 3}
value = { diagnosisNote }
disabled = {!isCheckedIn}
onChange = {(e) => setDiagnosisNote(e.target.value)}
placeholder = "Nhập chẩn đoán lâm sàng, triệu chứng, kết luận bệnh..."
    />
{ isCheckedIn && (
        <div className="flex justify-end" >
            <Button type="button" size = "sm" onClick = { handleSaveDiagnosis } >
                <Save className="size-4 mr-1" /> Lưu chẩn đoán
                    </Button>
                    </div>
                        )}
</div>
    </PortalSection>

{/* 4. Đơn thuốc đang kê (Hiển thị khi đã hoàn thành) */ }
{
    isDone && (
        <PortalSection
                        title="Đơn thuốc đang kê"
    description = "Danh sách các loại thuốc đã được thêm vào đơn, kèm trạng thái và ghi chú."
        >
        <div className="p-5 space-y-4" >
            <div className="flex items-center justify-between pb-2 border-b" >
                <span className="text-xs font-semibold text-slate-500 uppercase" > Trạng thái đơn: </span>
                    < StatusPill tone = { prescriptionStatusToneMap[prescriptionStatus]} >
                    { prescriptionStatusLabelMap[prescriptionStatus]}
                        </StatusPill>
                        </div>

    {
        prescriptionItems.length === 0 ? (
            <div className= "border border-dashed p-6 text-center text-sm text-muted-foreground" >
            Chưa có thuốc nào trong đơn.
                                </div>
                            ) : (
            <div className= "overflow-x-auto rounded-lg border" >
            <table className="w-full text-left text-sm text-slate-600" >
                <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase border-b" >
                    <tr>
                    <th className="px-4 py-3" > Tên thuốc </th>
                        < th className = "px-3 py-3 text-center" > Số lượng </th>
                            < th className = "px-3 py-3 text-center" > Đơn vị </th>
                                < th className = "px-4 py-3" > Liều dùng & Cách dùng </th>
        { prescriptionStatus === "Unpaid" && <th className="px-4 py-3 text-right" > Thao tác </th> }
        </tr>
            </thead>
            < tbody className = "divide-y divide-slate-200 bg-white" >
            {
                prescriptionItems.map((pItem, idx) => (
                    <tr key= { idx } className = "hover:bg-slate-50/80" >
                    <td className="px-4 py-3 font-medium text-slate-800" > { pItem.medicineName } </td>
                < td className = "px-3 py-3 text-center font-semibold text-slate-800" > { pItem.quantity } </td>
                < td className = "px-3 py-3 text-center text-xs" > { pItem.unit } </td>
                < td className = "px-4 py-3 text-xs text-slate-600" >
                <div>{ pItem.quantityPerDose } { pItem.unit } / lần × { pItem.dosesPerDay } lần / ngày({ pItem.duration } ngày) </div>
                < div className = "italic text-slate-500 mt-0.5" > HD: { pItem.note } </div>
                </td>
                                                    { prescriptionStatus === "Unpaid" && (
                        <td className="px-4 py-3 text-right" >
                <button
                                                                type="button"
                                                                onClick = {() => setPrescriptionItems((prev) => prev.filter((_, i) => i !== idx))}
        className = "text-xs font-medium text-red-600 hover:text-red-800 hover:underline"
            >
            Xóa
            </button>
            </td>
                                                    )
    }
    </tr>
                                            ))
}
</tbody>
    </table>
    </div>
                            )}

<div className="space-y-2 pt-3 border-t" >
    <Label htmlFor="case-prescription-note" > Ghi chú đơn thuốc </Label>
        < Textarea
id = "case-prescription-note"
rows = { 3}
value = { prescriptionNote }
disabled = { prescriptionStatus !== "Unpaid"}
onChange = {(e) => setPrescriptionNote(e.target.value)}
placeholder = "Lưu ý chung cho người bệnh..."
    />
    </div>

{
    prescriptionStatus === "Unpaid" && (
        <div className="flex justify-end pt-2" >
            <PortalAction variant="default" onClick = { handleSavePrescription } >
                <Save /> Lưu đơn thuốc
                </PortalAction>
                </div>
                            )
}
</div>
    </PortalSection>
                )}

{/* 5. Kê đơn cho ca khám (Chỉ hiện khi Đã hoàn thành và đơn chưa thanh toán) */ }
{
    isDone && prescriptionStatus === "Unpaid" && (
        <PortalSection
                        title="Kê đơn cho ca khám"
    description = "Tìm kiếm và thêm thuốc vào danh sách đơn thuốc."
        >
        <div className="space-y-5 p-5" >
            <div className="relative space-y-2" ref = { dropdownRef } >
                <Label>Tìm kiếm thuốc </Label>
                    < Input
    placeholder = "Nhập tên thuốc để tìm kiếm và chọn nhanh..."
    value = { medicineSearch }
    onChange = {(e) => {
        setMedicineSearch(e.target.value);
        setShowDropdown(true);
    }
}
onFocus = {() => setShowDropdown(true)}
                                />
{
    showDropdown && searchedMedicines.length > 0 && (
        <div className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white shadow-lg" >
        {
            searchedMedicines.map((med) => (
                <div
                                                key= { med.Uuid }
                                                className = "cursor-pointer px-3 py-2.5 text-sm hover:bg-slate-100 transition-colors border-b last:border-b-0"
                                                onClick = {() => {
                setSelectedMedicine(med);
                                                    setMedicineSearch(med.Name);
            setShowDropdown(false);
        }
}
                                            >
    <div className="font-medium text-slate-800" > { med.Name } </div>
        < div className = "text-xs text-muted-foreground" > Đơn vị: { String(med.Unit ?? "Viên") } </div>
            </div>
                                        ))}
</div>
                                )}
</div>

    < div className = "grid gap-4 sm:grid-cols-[1fr_7rem_7rem]" >
        <div className="space-y-2" >
            <Label>Tên thuốc </Label>
                < Input
value = { selectedMedicine?.Name || ""}
readOnly
placeholder = "Chọn thuốc từ thanh tìm kiếm trên"
className = "bg-slate-50 text-slate-700 cursor-not-allowed"
    />
    </div>
    < div className = "space-y-2" >
        <Label>Số lượng </Label>
            < Input
type = "number"
value = { quantity }
onChange = {(e) => setQuantity(e.target.value)}
                                    />
    </div>
    < div className = "space-y-2" >
        <Label>Đơn vị </Label>
            < Input
value = { selectedMedicine? String(selectedMedicine.Unit ?? "Viên") : ""}
readOnly
placeholder = "—"
className = "bg-slate-50 text-slate-700 cursor-not-allowed"
    />
    </div>
    </div>

    < div className = "grid gap-4 sm:grid-cols-3" >
        <div className="space-y-2" >
            <Label>Mỗi lần </Label>
                < Input
type = "number"
value = { quantityPerDose }
onChange = {(e) => setQuantityPerDose(e.target.value)}
                                    />
    </div>
    < div className = "space-y-2" >
        <Label>Lần / ngày </Label>
        < Input
type = "number"
value = { dosesPerDay }
onChange = {(e) => setDosesPerDay(e.target.value)}
                                    />
    </div>
    < div className = "space-y-2" >
        <Label>Số ngày </Label>
            < Input
type = "number"
value = { duration }
onChange = {(e) => setDuration(e.target.value)}
                                    />
    </div>
    </div>

    < div className = "space-y-2" >
        <Label htmlFor="case-medicine-note" > Hướng dẫn sử dụng </Label>
            < Input
id = "case-medicine-note"
value = { usageNote }
onChange = {(e) => setUsageNote(e.target.value)}
placeholder = "Uống sau ăn sáng và tối"
    />
    </div>

    < button
type = "button"
disabled = {!selectedMedicine}
onClick = {() => {
    if (!selectedMedicine) return;
    setPrescriptionItems((prev) => [
        ...prev,
        {
            medicineUuid: selectedMedicine.Uuid,
            medicineName: selectedMedicine.Name,
            unit: String(selectedMedicine.Unit ?? "Viên"),
            quantity: Number(quantity) || 1,
            quantityPerDose: Number(quantityPerDose) || 1,
            dosesPerDay: Number(dosesPerDay) || 1,
            duration: Number(duration) || 1,
            note: usageNote,
        },
    ]);
    setSelectedMedicine(null);
    setMedicineSearch("");
}}
className = "flex w-full items-center justify-center gap-2 border border-dashed border-primary/40 bg-secondary/50 py-3 text-sm font-semibold text-primary hover:bg-secondary disabled:opacity-50 transition-colors"
    >
    <FilePlus2 className="size-4" /> Thêm thuốc vào đơn
        </button>
        </div>
        </PortalSection>
                )}
</div>
    </div>
    );
}

function MedicalServiceResult({
    appointmentUuid,
    service,
    canEdit,
    onUpdate,
}: {
    appointmentUuid: string;
    service: ClinicalMedicalService;
    canEdit: boolean;
    onUpdate: (service: ClinicalMedicalService) => void;
}) {
    const [description, setDescription] = useState(service.Description);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const isCompleted = service.Status === "Done";

    async function save(status: ClinicalMedicalService["Status"]) {
        if (status === "Done" && !description.trim()) {
            setError("Vui lòng nhập kết quả dịch vụ trước khi hoàn tất.");
            return;
        }
        setIsSaving(true);
        setError("");
        try {
            const updated = await clinicalExaminationService.updateService(
                appointmentUuid,
                service.Uuid,
                description,
                status
            );
            setDescription(updated.Description);
            onUpdate(updated);
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Không thể cập nhật dịch vụ.");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <article className= "border bg-[#fbfdfe] p-4" >
        <div className="flex flex-wrap items-start justify-between gap-3" >
            <div className="flex min-w-0 gap-3" >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary" >
                    <FlaskConical className="size-4" />
                        </span>
                        < div >
                        <h3 className="font-semibold text-[#173b57]" > { service.Name } </h3>
                            < p className = "mt-1 text-xs text-muted-foreground" > { formatPrice(service.Price) } </p>
                                </div>
                                </div>
                                < StatusPill tone = { isCompleted? "green": "amber" } >
                                { isCompleted? "Đã xong": "Đang khám" }
                                    </StatusPill>
                                    </div>
                                    < div className = "mt-4 space-y-2" >
                                        <Label htmlFor={ `service-result-${service.Uuid}` }> Kết quả dịch vụ </Label>
                                            < Textarea
    id = {`service-result-${service.Uuid}`
}
rows = { 3}
value = { description }
disabled = {!canEdit || isCompleted || isSaving}
onChange = {(event) => setDescription(event.target.value)}
placeholder = "Nhập mô tả kết quả X-quang, nội soi, xét nghiệm..."
    />
    </div>
{ error ? <p className="mt-2 text-sm text-destructive" > { error } </p> : null }
{
    canEdit && !isCompleted ? (
        <div className= "mt-3 flex flex-wrap justify-end gap-2" >
        <Button type="button" size = "sm" variant = "outline" disabled = { isSaving } onClick = {() => save("Processing")
}>
    <Save /> Lưu kết quả
    </Button>
    < Button type = "button" size = "sm" disabled = { isSaving } onClick = {() => save("Done")}>
        <CheckCircle2 /> Hoàn tất dịch vụ
        </Button>
        </div>
            ) : null}
</article>
    );
}

function formatDateTime(value: Date) {
    const parts = getVietnamDateTimeParts(value);
    const [year, month, day] = parts.Date.split("-");
    return { date: `${day}/${month}/${year}`, time: parts.Time };
}

function genderLabel(gender: ClinicalAppointment["Gender"]) {
    return gender === "Male" ? "Nam" : gender === "Female" ? "Nữ" : "Khác";
}

function formatPrice(value: number) {
    return `${new Intl.NumberFormat("vi-VN").format(value)} đ`;
}

export default AssignedCaseDetailScreen;