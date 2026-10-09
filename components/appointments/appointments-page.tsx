"use client";

import { Building2, CalendarDays, Clock3, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import {
  AppointmentStatusBadge,
  getAppointmentTypeLabel,
} from "@/components/appointments/appointment-ui";
import { DiscoveryPagination } from "@/components/discovery/discovery-pagination";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/data-state";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatAppointmentDateTime } from "@/lib/format";
import { appointmentService } from "@/lib/services/appointment/AppointmentService";
import { cn } from "@/lib/utils";
import type { AppointmentList } from "@/types/appointments";
import { AppointmentStatus } from "@/types/models";

type ListState =
  | { status: "idle" }
  | { status: "success"; key: string; data: AppointmentList }
  | { status: "error"; key: string; message: string };

export function AppointmentsPage() {
  const { session } = useAuth();
  const searchParams = useSearchParams();
  const currentParams = searchParams.toString();
  const status = parseStatus(searchParams.get("status"));
  const type = parseType(searchParams.get("type"));
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const page = parsePage(searchParams.get("page"));
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${status || ""}:${type || ""}:${from}:${to}:${page}:${attempt}`;
  const [state, setState] = useState<ListState>({ status: "idle" });

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    let active = true;
    const key = requestKey;
    appointmentService
      .getAll(
        {
          accountUuid: session.Account.Uuid,
          status,
          type,
          from: from || undefined,
          to: to || undefined,
          page,
          pageSize: 4,
        },
        controller.signal,
      )
      .then((response) => {
        if (active) setState({ status: "success", key, data: response.Data });
      })
      .catch(() => {
        if (active) setState({ status: "error", key, message: "Không thể tải lịch hẹn. Vui lòng thử lại." });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt, from, page, requestKey, session, status, to, type]);

  if (!session) return null;

  return (
    <div className="min-w-0">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-primary">Khu vực Patient</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Lịch hẹn của tôi</h1>
          <p className="mt-3 leading-7 text-muted-foreground">
            Theo dõi yêu cầu, thời gian khám và trạng thái của tất cả loại lịch hẹn.
          </p>
        </div>
        <Link href="/co-so-y-te" className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}>
          Đặt lịch mới
        </Link>
      </div>

      <form key={currentParams} action="/tai-khoan/lich-hen" method="get" className="mt-8 rounded-xl border bg-card p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FilterSelect label="Trạng thái" name="status" defaultValue={status || ""}>
            <option value="">Tất cả trạng thái</option>
            <option value={AppointmentStatus.Pending}>Chờ duyệt</option>
            <option value={AppointmentStatus.Approved}>Đã duyệt</option>
            <option value={AppointmentStatus.Unconfirmed}>Không xác nhận</option>
            <option value={AppointmentStatus.CheckedIn}>Đang khám</option>
            <option value={AppointmentStatus.Done}>Đã hoàn thành</option>
            <option value={AppointmentStatus.Cancelled}>Đã hủy</option>
          </FilterSelect>
          <FilterSelect label="Loại lịch" name="type" defaultValue={type || ""}>
            <option value="">Tất cả loại lịch</option>
            <option value="hospital">Khám tại cơ sở</option>
            <option value="doctor">Khám với bác sĩ</option>
            <option value="medical-service">Dịch vụ y tế</option>
          </FilterSelect>
          <div className="space-y-2">
            <Label htmlFor="appointment-from">Từ ngày</Label>
            <Input id="appointment-from" name="from" type="date" defaultValue={from} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="appointment-to">Đến ngày</Label>
            <Input id="appointment-to" name="to" type="date" defaultValue={to} />
          </div>
        </div>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link href="/tai-khoan/lich-hen" className={cn(buttonVariants({ variant: "ghost" }), "w-full sm:w-auto")}>Xóa bộ lọc</Link>
          <button className={cn(buttonVariants(), "w-full sm:w-auto")} type="submit">Áp dụng</button>
        </div>
      </form>

      <section aria-live="polite" className="mt-7">
        {state.status === "idle" || state.key !== requestKey ? <LoadingState label="Đang tải lịch hẹn" /> : null}
        {state.status === "error" && state.key === requestKey ? (
          <ErrorState message={state.message} onRetry={() => setAttempt((value) => value + 1)} />
        ) : null}
        {state.status === "success" && state.key === requestKey ? (
          <>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-semibold">Danh sách lịch hẹn</h2>
              <p className="text-sm text-muted-foreground">{state.data.TotalItems} lịch</p>
            </div>
            {state.data.Items.length ? (
              <div className="space-y-4">
                {state.data.Items.map((item) => (
                  <article key={item.Appointment.Uuid} className="rounded-xl border bg-card p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-primary">{getAppointmentTypeLabel(item.Type)}</p>
                          <AppointmentStatusBadge status={item.Appointment.Status} />
                        </div>
                        <h3 className="mt-3 break-words text-lg font-bold">{item.TargetName}</h3>
                        <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                          <CardFact icon={CalendarDays} value={formatAppointmentDateTime(item.Appointment.AppointmentAt)} />
                          <CardFact icon={Building2} value={item.HospitalName} />
                          <CardFact icon={Stethoscope} value={`Người khám: ${item.Appointment.PatientName}`} />
                          <CardFact icon={Clock3} value={item.RoomName ? `Phòng: ${item.RoomName}` : "Phòng: Chưa phân"} />
                        </div>
                      </div>
                      <Link href={`/tai-khoan/lich-hen/${item.Appointment.Uuid}`} className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}>
                        Xem chi tiết
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                message="Không có lịch hẹn phù hợp với bộ lọc hiện tại."
                action={<Link href="/tai-khoan/lich-hen" className={buttonVariants({ variant: "outline" })}>Xóa bộ lọc</Link>}
              />
            )}
            <DiscoveryPagination pathname="/tai-khoan/lich-hen" currentParams={currentParams} page={state.data.Page} totalPages={state.data.TotalPages} />
          </>
        ) : null}
      </section>
    </div>
  );
}

function FilterSelect({ label, children, ...props }: React.ComponentProps<"select"> & { label: string }) {
  const id = `filter-${props.name}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select id={id} className="h-8 w-full rounded-lg border bg-background px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" {...props}>
        {children}
      </select>
    </div>
  );
}

function CardFact({ icon: Icon, value }: { icon: typeof CalendarDays; value: string }) {
  return <p className="flex min-w-0 items-start gap-2"><Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" /><span className="break-words">{value}</span></p>;
}

function parsePage(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function parseStatus(value: string | null) {
  return Object.values(AppointmentStatus).includes(value as AppointmentStatus)
    ? (value as AppointmentStatus)
    : undefined;
}

function parseType(value: string | null) {
  return value === "hospital" || value === "doctor" || value === "medical-service" ? value : undefined;
}
