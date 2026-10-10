"use client";

import { CalendarDays, Search, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  PortalAction,
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
import { internalClinicalService } from "@/lib/services/appointment/InternalClinicalService";
import { cn } from "@/lib/utils";
import type {
  ClinicalAppointment,
  ClinicalAppointmentStatus,
} from "@/types/internal-clinical";

type LoadState =
  | { status: "loading" }
  | { status: "success"; items: ClinicalAppointment[] }
  | { status: "error"; message: string };

const statusLabels: Record<ClinicalAppointmentStatus, string> = {
  Approved: "Đã xác nhận",
  CheckedIn: "Đã check-in",
  Done: "Hoàn thành",
  Pending: "Chưa đến",
};

export function DoctorScheduleScreen() {
  const [date, setDate] = useState(getVietnamToday);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    internalClinicalService
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
    const keyword = search.trim().toLocaleLowerCase("vi-VN");
    return state.items.filter(
      (item) =>
        (!status || item.Status === status) &&
        (!keyword ||
          item.PatientName.toLocaleLowerCase("vi-VN").includes(keyword) ||
          item.MedicalCode.toLocaleLowerCase("vi-VN").includes(keyword)),
    );
  }, [search, state, status]);

  const rows = filteredItems.map((item) => [
    formatTime(item.AppointmentAt),
    `${item.PatientName} · ${item.MedicalCode}`,
    item.TypeLabel,
    item.RoomName,
    <AppointmentStatus key={`status-${item.Uuid}`} status={item.Status} />,
    <Link
      key={`action-${item.Uuid}`}
      href={`/noi-bo/trang-tong/ca-kham/${item.Uuid}`}
      className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
    >
      <Stethoscope aria-hidden="true" />
      Khám ngay
    </Link>,
  ]);

  return (
    <div className="space-y-6">
      <PortalPageHeader
        eyebrow="Ca được phân công"
        title="Lịch khám của tôi"
        description="Chỉ hiển thị lịch được phân công trực tiếp cho tài khoản bác sĩ hiện tại."
        actions={<PortalAction variant="default">In lịch đã chọn</PortalAction>}
      />

      <PortalSection
        title={formatSelectedDate(date)}
        description={
          state.status === "success"
            ? `${state.items.length} ca khám được phân công`
            : "Lịch khám được phân công"
        }
      >
        <div className="flex flex-col gap-3 border-b bg-[#fbfdfe] p-4 lg:flex-row lg:items-end">
          <label className="relative min-w-0 flex-1 lg:max-w-sm">
            <span className="sr-only">Tìm bệnh nhân hoặc mã y tế</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm bệnh nhân hoặc mã y tế"
              className="h-9 pl-9"
            />
          </label>

          <label className="min-w-48">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <CalendarDays className="size-3.5" aria-hidden="true" />
              Ngày khám
            </span>
            <Input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="h-9 bg-white"
            />
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              Trạng thái
            </span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-9 rounded-md border bg-white px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>

        {state.status === "loading" ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Đang tải lịch khám...</p>
        ) : state.status === "error" ? (
          <p className="p-8 text-center text-sm text-destructive">{state.message}</p>
        ) : rows.length ? (
          <PortalTable
            caption="Lịch khám của bác sĩ"
            columns={["Giờ", "Bệnh nhân", "Loại", "Phòng", "Trạng thái", "Thao tác"]}
            rows={rows}
          />
        ) : (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Không có ca khám phù hợp trong ngày đã chọn.
          </p>
        )}
      </PortalSection>
    </div>
  );
}

function AppointmentStatus({ status }: { status: ClinicalAppointmentStatus }) {
  const tones: Record<ClinicalAppointmentStatus, "amber" | "blue" | "green"> = {
    Approved: "blue",
    CheckedIn: "blue",
    Done: "green",
    Pending: "amber",
  };
  return <StatusPill tone={tones[status]}>{statusLabels[status]}</StatusPill>;
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
  return `${weekday.charAt(0).toLocaleUpperCase("vi-VN")}${weekday.slice(1)}, ${day}/${month}/${date.slice(0, 4)}`;
}
