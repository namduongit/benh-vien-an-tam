"use client";

import { CalendarDays, Eye, Search, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
    PortalPageHeader,
    PortalSection,
    PortalTable,
    StatusPill,
} from "@/components/internal/portal-ui";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    getVietnamDateTimeParts,
    getVietnamToday,
} from "@/lib/booking/working-hours";
import { doctorAppointmentService } from "@/lib/services/appointment/doctorAppointmentService";
import { cn } from "@/lib/utils";
import type {
    ClinicalAppointment,
    ClinicalAppointmentStatus,
} from "@/types/internal-clinical";

type LoadState =
    | { status: "loading" }
    | { status: "success"; items: ClinicalAppointment[] }
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

export function DoctorScheduleScreen() {
    const [date, setDate] = useState(getVietnamToday);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [status, setStatus] = useState("");
    const [state, setState] = useState<LoadState>({ status: "loading" });

    // Debounce tìm kiếm từ 1 - 1.5s
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 1200);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        const controller = new AbortController();
        setState({ status: "loading" });
        doctorAppointmentService
            .getAppointments(date, controller.signal)
            .then((items) => setState({ status: "success", items }))
            .catch((error: unknown) => {
                if (!controller.signal.aborted) {
                    setState({
                        status: "error",
                        message: error instanceof Error ? error.message : "Không thể tải lịch khám.",
                    });
                }
            });
        return () => controller.abort();
    }, [date]);

    const filteredItems = useMemo(() => {
        if (state.status !== "success") return [];
        const keyword = debouncedSearch.trim().toLocaleLowerCase("vi-VN");
        return state.items.filter(
            (item) =>
                (!status || item.Status === status) &&
                (!keyword ||
                    item.PatientName.toLocaleLowerCase("vi-VN").includes(keyword) ||
                    item.MedicalCode.toLocaleLowerCase("vi-VN").includes(keyword))
        );
    }, [debouncedSearch, state, status]);

    const rows = filteredItems.map((item) => {
        const isReadOnly =
            item.Status === "Done" ||
            item.Status === "Pending" ||
            item.Status === "Cancelled" ||
            item.Status === "Unconfirmed";

        return [
            formatTime(item.AppointmentAt),
            `${item.PatientName} · ${item.MedicalCode}`,
            item.TypeLabel,
            item.RoomName,
            <AppointmentStatus key={`status-${item.Uuid}`} status = { item.Status } />,
        isReadOnly ? (
            <Link
                    key= {`action-${item.Uuid}`}
href = {`/noi-bo/trang-tong/ca-kham/${item.Uuid}`}
className = { cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
                >
    <Eye className="size-4" aria-hidden="true" />
        Xem chi tiết
            </Link>
            ) : (
    <Link
                    key= {`action-${item.Uuid}`}
href = {`/noi-bo/trang-tong/ca-kham/${item.Uuid}`}
className = { cn(buttonVariants({ size: "sm" }), "gap-1.5")}
                >
    <Stethoscope className="size-4" aria-hidden="true" />
        Khám ngay
            </Link>
            ),
        ];
    });

return (
    <div className= "space-y-6" >
    <PortalPageHeader
                eyebrow="Ca được phân công"
title = "Lịch khám của tôi"
description = "Chỉ hiển thị lịch được phân công trực tiếp cho tài khoản bác sĩ hiện tại."
    />

    <PortalSection
                title={ formatSelectedDate(date) }
description = {
    state.status === "success"
        ? `${state.items.length} ca khám được phân công`
        : "Lịch khám được phân công"
}
    >
    <div className="flex flex-col gap-3 border-b bg-[#fbfdfe] p-4 lg:flex-row lg:items-end" >
        <label className="relative min-w-0 flex-1 lg:max-w-sm" >
            <span className="sr-only" > Tìm bệnh nhân hoặc mã y tế </span>
                < Search className = "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                            value={ search }
onChange = {(event) => setSearch(event.target.value)}
placeholder = "Tìm bệnh nhân hoặc mã y tế"
className = "h-9 pl-9"
    />
    </label>

    < label className = "min-w-48" >
        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground" >
            <CalendarDays className="size-3.5" aria-hidden="true" />
                Ngày khám
                    </span>
                    < Input
type = "date"
value = { date }
onChange = {(event) => setDate(event.target.value)}
className = "h-9 bg-white"
    />
    </label>

    < label >
    <span className="mb-1.5 block text-xs font-semibold text-muted-foreground" >
        Trạng thái
            </span>
            < select
value = { status }
onChange = {(event) => setStatus(event.target.value)}
className = "h-9 rounded-md border bg-white px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
    >
    <option value="" > Tất cả trạng thái </option>
{
    Object.entries(statusLabels).map(([value, label]) => (
        <option key= { value } value = { value } >
        { label }
        </option>
    ))
}
</select>
    </label>
    </div>

{
    state.status === "loading" ? (
        <p className= "p-8 text-center text-sm text-muted-foreground" >
        Đang tải lịch khám...
    </p>
                ) : state.status === "error" ? (
        <p className= "p-8 text-center text-sm text-destructive" >
        { state.message }
        </p>
                ) : rows.length ? (
        <PortalTable
                        caption= "Lịch khám của bác sĩ"
                        columns = { ["Giờ", "Bệnh nhân", "Loại", "Phòng", "Trạng thái", "Thao tác"]}
    rows = { rows }
        />
                ) : (
        <p className= "p-8 text-center text-sm text-muted-foreground" >
        Không có ca khám phù hợp trong ngày đã chọn.
                    </p>
                )
}
</PortalSection>
    </div>
    );
}

function AppointmentStatus({ status }: { status: ClinicalAppointmentStatus }) {
    const tone = statusTones[status] ?? "amber";
    const label = statusLabels[status] ?? status;
    return <StatusPill tone={ tone }> { label } </StatusPill>;
}

function formatTime(value: Date) {
    return getVietnamDateTimeParts(value).Time;
}

function formatSelectedDate(date: string) {
    const value = new Date(`${date}T12:00:00+07:00`);
    if (Number.isNaN(value.getTime())) return "Lịch khám";
    const weekday = new Intl.DateTimeFormat("vi-VN", {
        weekday: "long",
        timeZone: "Asia/Ho_Chi_Minh",
    }).format(value);
    const [, month, day] = date.split("-");
    return `${weekday.charAt(0).toLocaleUpperCase("vi-VN")}${weekday.slice(
        1
    )}, ${day}/${month}/${date.slice(0, 4)}`;
}