"use client";

import {
  ArrowRight,
  CalendarClock,
  CalendarPlus,
  Clock3,
  ClipboardList,
  Search,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import {
  AppointmentStatusBadge,
  getAppointmentTypeLabel,
} from "@/components/appointments/appointment-ui";
import {
  DiscoveryFilters,
  type DiscoveryFilter,
} from "@/components/discovery/discovery-filters";
import { DirectoryHero } from "@/components/discovery/directory-hero";
import { DiscoveryPagination } from "@/components/discovery/discovery-pagination";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/data-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatAppointmentDateTime, formatPrice, markdownToPlainText } from "@/lib/format";
import type { PaginatedData } from "@/lib/http/response";
import { appointmentService } from "@/lib/services/appointment/AppointmentService";
import { hospitalService } from "@/lib/services/hospital/HospitalService";
import { medicalServiceService } from "@/lib/services/medical-service/MedicalServiceService";
import { cn } from "@/lib/utils";
import type { AppointmentList } from "@/types/appointments";
import { type Hospital, type MedicalService } from "@/types/models";
import { AppointmentStatus } from "@/types/models";

type DirectoryData = {
  result: PaginatedData<MedicalService>;
  hospitals: Hospital[];
};

type DirectoryState =
  | { status: "idle" }
  | { status: "success"; key: string; data: DirectoryData }
  | { status: "error"; key: string; message: string };

type AppointmentsState =
  | { status: "loading" }
  | { status: "success"; items: AppointmentList }
  | { status: "error"; message: string };

export function PatientServiceDirectory() {
  const { session } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentParams = searchParams.toString();
  const query = searchParams.get("q")?.trim() || "";
  const hospital = searchParams.get("hospital") || "";
  const page = parsePage(searchParams.get("page"));
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${query}:${hospital}:${page}:${attempt}`;
  const [state, setState] = useState<DirectoryState>({ status: "idle" });
  const [appointments, setAppointments] = useState<AppointmentsState>({
    status: "loading",
  });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const key = requestKey;
    Promise.all([
      medicalServiceService.getAll(
        {
          q: query || undefined,
          hospital: hospital || undefined,
          page,
          pageSize: 4,
        },
        controller.signal,
      ),
      hospitalService.getOptions(controller.signal),
    ])
      .then(([serviceResponse, hospitalResponse]) => {
        if (!active) return;
        setState({
          status: "success",
          key,
          data: {
            result: serviceResponse.Data,
            hospitals: hospitalResponse.Data,
          },
        });
      })
      .catch(() => {
        if (!active) return;
        setState({
          status: "error",
          key,
          message: "Không thể tải danh sách dịch vụ y tế. Vui lòng thử lại.",
        });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [hospital, page, query, requestKey]);

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    let active = true;
    appointmentService
      .getAll(
        {
          accountUuid: session.Account.Uuid,
          type: "medical-service",
          status: AppointmentStatus.Approved,
          pageSize: 3,
        },
        controller.signal,
      )
      .then((response) => {
        if (!active) return;
        setAppointments({ status: "success", items: response.Data });
      })
      .catch(() => {
        if (!active) return;
        setAppointments({
          status: "error",
          message: "Không thể tải lịch đăng ký dịch vụ.",
        });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [session]);

  const isCurrent = state.status !== "idle" && state.key === requestKey;
  const data = state.status === "success" && isCurrent ? state.data : null;
  const filters = getFilters(data?.hospitals ?? []);

  useEffect(() => {
    if (!data || data.result.Page === page) return;
    const params = new URLSearchParams(currentParams);
    if (data.result.Page === 1) params.delete("page");
    else params.set("page", String(data.result.Page));
    const nextParams = params.toString();
    router.replace(nextParams ? `/dich-vu?${nextParams}` : "/dich-vu", {
      scroll: false,
    });
  }, [currentParams, data, page, router]);

  if (!session) return null;

  return (
    <div>
      <PatientHeroBanner name={session.PatientProfile.Name} />

      <PatientAppointmentStrip
        state={appointments}
        emptyMessage="Chưa có lịch dịch vụ y tế nào được duyệt."
      />

      <DirectoryHero
        eyebrow="Dành cho bạn"
        title="Chọn đúng dịch vụ, chuẩn bị tốt hơn cho buổi khám"
        description="Tra cứu nội dung thực hiện, chi phí dự kiến, thời gian và cơ sở cung cấp trước khi đặt lịch."
        benefits={[
          "Nội dung và chi phí dự kiến rõ ràng",
          "Lọc nhanh theo cơ sở đang cung cấp",
        ]}
        actionLabel="Khám phá dịch vụ"
        actionHref="#patient-service-results"
        image="https://res.cloudinary.com/dzpgchw3n/image/upload/v1790131852/images_eclihy.jpg"
        imageAlt="Minh họa dịch vụ y tế"
      />

      <section
        id="patient-service-results"
        className="scroll-mt-20 bg-muted/45 py-9 sm:py-12"
      >
        <div className="container-shell">
          <nav
            aria-label="Đường dẫn"
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Link href="/" className="hover:text-foreground">
              Trang chủ
            </Link>
            <ArrowRight aria-hidden="true" className="size-3.5" />
            <span className="font-medium text-foreground">Dịch vụ y tế</span>
          </nav>

          <div className="mt-6 rounded-2xl border bg-card p-3 shadow-sm sm:p-4">
            <form
              key={`${query}:${hospital}`}
              action="/dich-vu"
              method="get"
              role="search"
              className="flex min-w-0 flex-col gap-2 sm:flex-row"
            >
              {hospital ? <input type="hidden" name="hospital" value={hospital} /> : null}
              <div className="relative min-w-0 flex-1">
                <Search
                  aria-hidden="true"
                  className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  name="q"
                  defaultValue={query}
                  aria-label="Tìm dịch vụ y tế"
                  placeholder="Tìm tên hoặc nội dung dịch vụ..."
                  className="h-12 border-0 bg-muted/55 pl-11 shadow-none focus-visible:ring-1"
                />
              </div>
              <button
                type="submit"
                className={cn(buttonVariants({ size: "lg" }), "h-12 px-7")}
              >
                Tìm dịch vụ
              </button>
            </form>
          </div>

          <div className="mt-7 grid min-w-0 gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
            <aside className="self-start lg:sticky lg:top-24">
              {data ? (
                <DiscoveryFilters
                  key={currentParams}
                  pathname="/dich-vu"
                  currentParams={currentParams}
                  filters={filters}
                />
              ) : (
                <FilterSkeleton />
              )}
            </aside>

            <section aria-live="polite" className="min-w-0">
              {!isCurrent ? <ServiceResultsSkeleton /> : null}
              {state.status === "error" && isCurrent ? (
                <ErrorState
                  message={state.message}
                  onRetry={() => setAttempt((value) => value + 1)}
                />
              ) : null}
              {data ? (
                <>
                  <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-primary">
                        Chăm sóc theo nhu cầu
                      </p>
                      <h2 className="mt-1 text-2xl font-bold tracking-tight">
                        Dịch vụ đang cung cấp
                      </h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {data.result.TotalItems} dịch vụ
                    </p>
                  </div>

                  {data.result.Items.length ? (
                    <div className="grid items-stretch gap-5 xl:grid-cols-2">
                      {data.result.Items.map((service) => (
                        <ServiceDirectoryCard key={service.Uuid} service={service} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      message="Không tìm thấy dịch vụ phù hợp với từ khóa và cơ sở đã chọn."
                      action={
                        <Link
                          href="/dich-vu"
                          className={cn(buttonVariants({ variant: "outline" }))}
                        >
                          Xóa tìm kiếm và bộ lọc
                        </Link>
                      }
                    />
                  )}
                  <DiscoveryPagination
                    pathname="/dich-vu"
                    currentParams={currentParams}
                    page={data.result.Page}
                    totalPages={data.result.TotalPages}
                  />
                </>
              ) : null}
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}

function PatientHeroBanner({ name }: { name: string }) {
  return (
    <section className="border-b border-primary/15 bg-gradient-to-br from-white via-white to-[#fff8e7]">
      <div className="container-shell grid items-center gap-6 py-8 sm:py-10 lg:grid-cols-[1.5fr_1fr]">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-full bg-[#a56800]/10 px-3 py-1 text-xs font-semibold text-[#a56800]">
            <Sparkles aria-hidden="true" className="size-3.5" />
            Tra cứu dành cho bạn
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Xin chào {name}, chọn dịch vụ phù hợp
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            So sánh chi phí và cơ sở cung cấp trước khi đăng ký dịch vụ. Lịch đã
            đặt sẽ xuất hiện ngay trong tài khoản của bạn.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/tai-khoan/lich-hen" className={cn(buttonVariants())}>
              <CalendarClock aria-hidden="true" />
              Lịch hẹn của tôi
            </Link>
            <Link
              href="/bac-si"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <ClipboardList aria-hidden="true" />
              Tìm theo bác sĩ
            </Link>
          </div>
        </div>
        <div className="hidden lg:block">
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Dịch vụ" value="Đa lĩnh vực" />
            <StatCard label="Chi phí" value="Minh bạch" />
            <StatCard label="Cơ sở" value="Đang hoạt động" />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#a56800]/15 bg-card p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 break-words font-bold text-[#a56800]">{value}</p>
    </div>
  );
}

function PatientAppointmentStrip({
  state,
  emptyMessage,
}: {
  state: AppointmentsState;
  emptyMessage: string;
}) {
  if (state.status === "loading") {
    return (
      <div className="container-shell py-6">
        <LoadingState label="Đang tải lịch dịch vụ" />
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <div className="container-shell py-6">
        <ErrorState message={state.message} />
      </div>
    );
  }
  if (!state.items.Items.length) {
    return null;
  }
  return (
    <section className="border-b bg-secondary/30">
      <div className="container-shell py-6 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">Lịch đã duyệt</p>
            <h2 className="mt-1 text-lg font-bold">Dịch vụ sắp thực hiện</h2>
          </div>
          <Link
            href="/tai-khoan/lich-hen?type=medical-service"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Xem tất cả
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {state.items.Items.map((item) => (
            <Link
              key={item.Appointment.Uuid}
              href={`/tai-khoan/lich-hen/${item.Appointment.Uuid}`}
              className="group flex min-w-0 items-start gap-3 rounded-xl border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#a56800]/10 text-[#a56800]">
                <ClipboardList aria-hidden="true" className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#a56800]">
                    {getAppointmentTypeLabel(item.Type)}
                  </span>
                  <AppointmentStatusBadge status={item.Appointment.Status} />
                </span>
                <span className="mt-1 block break-words text-sm font-semibold group-hover:text-primary">
                  {item.TargetName}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {formatAppointmentDateTime(item.Appointment.AppointmentAt)} · {item.HospitalName}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceDirectoryCard({ service }: { service: MedicalService }) {
  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md">
      <Link
        href={`/dich-vu/${service.Slug}`}
        className="relative block aspect-[16/7] overflow-hidden bg-muted"
      >
        <Image
          src={service.Image}
          alt={`Minh họa ${service.Name}`}
          fill
          sizes="(min-width: 1280px) 35vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-primary shadow-sm">
          Dịch vụ đang hoạt động
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Link href={`/dich-vu/${service.Slug}`}>
          <h3 className="text-xl font-bold leading-7 group-hover:text-primary">
            {service.Name}
          </h3>
        </Link>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
          {markdownToPlainText(service.Description) || "Thông tin đang được cập nhật."}
        </p>
        <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
          <Clock3 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
          {service.WorkingHour}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <span className="text-sm text-muted-foreground">Chi phí dự kiến</span>
          <strong className="text-base text-primary">{formatPrice(service.Price)}</strong>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Link
            href={`/dich-vu/${service.Slug}`}
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          >
            Xem chi tiết
          </Link>
          <Link
            href={`/dat-lich/dich-vu?service=${service.Uuid}`}
            className={cn(buttonVariants(), "w-full")}
          >
            <CalendarPlus aria-hidden="true" />
            Đặt lịch
          </Link>
        </div>
      </div>
    </article>
  );
}

function getFilters(hospitals: Hospital[]): DiscoveryFilter[] {
  return [
    {
      key: "hospital",
      label: "Cơ sở cung cấp",
      allLabel: "Tất cả cơ sở",
      options: hospitals.map((item) => ({ value: item.Uuid, label: item.Name })),
    },
  ];
}

function FilterSkeleton() {
  return (
    <div className="hidden h-48 animate-pulse rounded-xl bg-muted lg:block" aria-label="Đang tải bộ lọc" />
  );
}

function ServiceResultsSkeleton() {
  return (
    <div className="animate-pulse" aria-label="Đang tải danh sách dịch vụ">
      <div className="h-8 w-64 rounded bg-muted" />
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-[28rem] rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

export function PatientServiceDirectorySkeleton() {
  return (
    <div>
      <div className="h-44 animate-pulse bg-secondary/40" />
      <div className="h-80 animate-pulse bg-secondary/40" />
      <div className="container-shell py-10">
        <ServiceResultsSkeleton />
      </div>
    </div>
  );
}

function parsePage(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}