"use client";

import {
  ArrowRight,
  Building2,
  CalendarClock,
  CalendarPlus,
  Sparkles,
  Stethoscope,
  UserRound,
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
import { formatAppointmentDateTime, formatPrice } from "@/lib/format";
import type { PaginatedData } from "@/lib/http/response";
import { appointmentService } from "@/lib/services/appointment/AppointmentService";
import { departmentService } from "@/lib/services/department/DepartmentService";
import { doctorService } from "@/lib/services/doctor/DoctorService";
import { hospitalService } from "@/lib/services/hospital/HospitalService";
import { cn } from "@/lib/utils";
import type { AppointmentList } from "@/types/appointments";
import {
  type Department,
  type DoctorProfile,
  type Hospital,
} from "@/types/models";
import { AppointmentStatus } from "@/types/models";

type DirectoryData = {
  result: PaginatedData<DoctorProfile>;
  departments: Department[];
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

const benefits = [
  "Hồ sơ chuyên môn và nơi làm việc rõ ràng",
  "Lọc nhanh theo cơ sở và chuyên khoa cần khám",
];

export function PatientDoctorDirectory() {
  const { session } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentParams = searchParams.toString();
  const query = searchParams.get("q")?.trim() || "";
  const department = searchParams.get("department") || "";
  const hospital = searchParams.get("hospital") || "";
  const page = parsePage(searchParams.get("page"));
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${query}:${department}:${hospital}:${page}:${attempt}`;
  const [state, setState] = useState<DirectoryState>({ status: "idle" });
  const [appointments, setAppointments] = useState<AppointmentsState>({
    status: "loading",
  });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const key = requestKey;
    Promise.all([
      doctorService.getAll(
        {
          q: query || undefined,
          department: department || undefined,
          hospital: hospital || undefined,
          page,
          pageSize: 4,
        },
        controller.signal,
      ),
      departmentService.getOptions(controller.signal),
      hospitalService.getOptions(controller.signal),
    ])
      .then(([doctorResponse, departmentResponse, hospitalResponse]) => {
        if (!active) return;
        setState({
          status: "success",
          key,
          data: {
            result: doctorResponse.Data,
            departments: departmentResponse.Data,
            hospitals: hospitalResponse.Data,
          },
        });
      })
      .catch(() => {
        if (!active) return;
        setState({
          status: "error",
          key,
          message: "Không thể tải danh sách bác sĩ. Vui lòng thử lại.",
        });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [department, hospital, page, query, requestKey]);

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    let active = true;
    appointmentService
      .getAll(
        {
          accountUuid: session.Account.Uuid,
          type: "doctor",
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
          message: "Không thể tải lịch khám với bác sĩ.",
        });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [session]);

  const isCurrent = state.status !== "idle" && state.key === requestKey;
  const data = state.status === "success" && isCurrent ? state.data : null;
  const filters = getFilters(data?.departments ?? [], data?.hospitals ?? []);

  useEffect(() => {
    if (!data || data.result.Page === page) return;
    const params = new URLSearchParams(currentParams);
    if (data.result.Page === 1) params.delete("page");
    else params.set("page", String(data.result.Page));
    const nextParams = params.toString();
    router.replace(nextParams ? `/bac-si?${nextParams}` : "/bac-si", {
      scroll: false,
    });
  }, [currentParams, data, page, router]);

  if (!session) return null;

  return (
    <div>
      <PatientHeroBanner name={session.PatientProfile.Name} />

      <PatientAppointmentStrip
        state={appointments}
        emptyMessage="Chưa có lịch khám với bác sĩ nào được duyệt."
      />

      <DirectoryHero
        eyebrow="Dành cho bạn"
        title="Tìm bác sĩ phù hợp, đặt lịch dễ dàng"
        description="Tra cứu đội ngũ bác sĩ theo chuyên khoa và cơ sở, xem thông tin chuyên môn trước khi chọn lịch khám."
        benefits={benefits}
        actionLabel="Xem danh sách bác sĩ"
        actionHref="#patient-doctor-results"
        image="https://res.cloudinary.com/dzpgchw3n/image/upload/v1790131811/bac-si-kham-17229072164681765628147_sqsxv8.webp"
        imageAlt="Minh họa bác sĩ"
      />

      <section
        id="patient-doctor-results"
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
            <span className="font-medium text-foreground">Bác sĩ</span>
          </nav>

          <div className="mt-6 rounded-2xl border bg-card p-3 shadow-sm sm:p-4">
            <form
              key={`${query}:${department}:${hospital}`}
              action="/bac-si"
              method="get"
              role="search"
              className="flex min-w-0 flex-col gap-2 sm:flex-row"
            >
              {department ? (
                <input type="hidden" name="department" value={department} />
              ) : null}
              {hospital ? (
                <input type="hidden" name="hospital" value={hospital} />
              ) : null}
              <div className="relative min-w-0 flex-1">
                <Stethoscope
                  aria-hidden="true"
                  className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  name="q"
                  defaultValue={query}
                  aria-label="Tìm bác sĩ"
                  placeholder="Tìm theo tên, chuyên môn hoặc nơi làm việc..."
                  className="h-12 border-0 bg-muted/55 pl-11 shadow-none focus-visible:ring-1"
                />
              </div>
              <button
                type="submit"
                className={cn(buttonVariants({ size: "lg" }), "h-12 px-7")}
              >
                Tìm bác sĩ
              </button>
            </form>
          </div>

          <div className="mt-7 grid min-w-0 gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
            <aside className="self-start lg:sticky lg:top-24">
              {data ? (
                <DiscoveryFilters
                  key={currentParams}
                  pathname="/bac-si"
                  currentParams={currentParams}
                  filters={filters}
                />
              ) : (
                <FilterSkeleton />
              )}
            </aside>

            <section aria-live="polite" className="min-w-0">
              {!isCurrent ? <DoctorResultsSkeleton /> : null}
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
                        Đội ngũ chuyên môn
                      </p>
                      <h2 className="mt-1 text-2xl font-bold tracking-tight">
                        Bác sĩ phù hợp với bạn
                      </h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {data.result.TotalItems} bác sĩ
                    </p>
                  </div>

                  {data.result.Items.length ? (
                    <div className="grid items-stretch gap-5 xl:grid-cols-2">
                      {data.result.Items.map((doctor) => (
                        <DoctorDirectoryCard key={doctor.Uuid} doctor={doctor} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      message="Không tìm thấy bác sĩ phù hợp với từ khóa và bộ lọc hiện tại."
                      action={
                        <Link
                          href="/bac-si"
                          className={cn(buttonVariants({ variant: "outline" }))}
                        >
                          Xóa tìm kiếm và bộ lọc
                        </Link>
                      }
                    />
                  )}
                  <DiscoveryPagination
                    pathname="/bac-si"
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
    <section className="border-b border-primary/15 bg-gradient-to-br from-white via-white to-[#eaf6fd]">
      <div className="container-shell grid items-center gap-6 py-8 sm:py-10 lg:grid-cols-[1.5fr_1fr]">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles aria-hidden="true" className="size-3.5" />
            Tra cứu dành cho bạn
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Xin chào {name}, chọn bác sĩ để bắt đầu
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Lọc theo chuyên khoa và cơ sở, sau đó chọn bác sĩ phù hợp. Bạn có thể
            đặt lịch ngay hoặc lưu hồ sơ để tham khảo sau.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/tai-khoan/lich-hen" className={cn(buttonVariants())}>
              <CalendarClock aria-hidden="true" />
              Lịch hẹn của tôi
            </Link>
            <Link
              href="/co-so-y-te"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <UserRound aria-hidden="true" />
              Tìm theo cơ sở
            </Link>
          </div>
        </div>
        <div className="hidden lg:block">
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Bác sĩ" value="Đa chuyên khoa" />
            <StatCard label="Lịch khám" value="Linh hoạt" />
            <StatCard label="Theo dõi" value="Trong tài khoản" />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-primary/15 bg-card p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 break-words font-bold text-primary">{value}</p>
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
        <LoadingState label="Đang tải lịch khám với bác sĩ" />
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
            <h2 className="mt-1 text-lg font-bold">Khám với bác sĩ sắp tới</h2>
          </div>
          <Link
            href="/tai-khoan/lich-hen?type=doctor"
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
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CalendarClock aria-hidden="true" className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary">
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

function DoctorDirectoryCard({ doctor }: { doctor: DoctorProfile }) {
  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md">
      <div className="grid min-w-0 grid-cols-[7rem_minmax(0,1fr)] gap-4 p-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:p-5">
        <Link
          href={`/bac-si/${doctor.Slug}`}
          className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[linear-gradient(145deg,var(--muted),var(--secondary))]"
        >
          <Image
            src={doctor.Avatar}
            alt={`Bác sĩ ${doctor.Name}`}
            fill
            sizes="144px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </Link>
        <div className="min-w-0 py-1">
          <span className="inline-flex max-w-full rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            <span className="truncate">{doctor.DepartmentDisplay}</span>
          </span>
          <Link href={`/bac-si/${doctor.Slug}`} className="block">
            <h3 className="mt-3 break-words text-lg font-bold leading-7 group-hover:text-primary">
              {doctor.Name}
            </h3>
          </Link>
          <DoctorFact icon={Stethoscope} value={doctor.Specialty} />
          <DoctorFact icon={Building2} value={doctor.Workplace} />
        </div>
      </div>
      <div className="mt-auto border-t px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Phí khám dự kiến</span>
          <strong className="text-sm text-primary">{formatPrice(doctor.Price)}</strong>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Link
            href={`/bac-si/${doctor.Slug}`}
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          >
            Xem hồ sơ
          </Link>
          <Link
            href={`/dat-lich/bac-si?doctor=${doctor.Uuid}`}
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

function DoctorFact({
  icon: Icon,
  value,
}: {
  icon: typeof Stethoscope;
  value: string;
}) {
  return (
    <p className="mt-2 flex min-w-0 items-start gap-2 text-sm leading-6 text-muted-foreground">
      <Icon aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" />
      <span className="break-words">{value}</span>
    </p>
  );
}

function getFilters(
  departments: Department[],
  hospitals: Hospital[],
): DiscoveryFilter[] {
  return [
    {
      key: "hospital",
      label: "Cơ sở y tế",
      allLabel: "Tất cả cơ sở",
      options: hospitals.map((item) => ({ value: item.Uuid, label: item.Name })),
    },
    {
      key: "department",
      label: "Chuyên khoa",
      allLabel: "Tất cả chuyên khoa",
      options: departments.map((item) => ({ value: item.Uuid, label: item.Name })),
    },
  ];
}

function FilterSkeleton() {
  return (
    <div className="hidden h-64 animate-pulse rounded-xl bg-muted lg:block" aria-label="Đang tải bộ lọc" />
  );
}

function DoctorResultsSkeleton() {
  return (
    <div className="animate-pulse" aria-label="Đang tải danh sách bác sĩ">
      <div className="h-8 w-64 rounded bg-muted" />
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-80 rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

export function PatientDoctorDirectorySkeleton() {
  return (
    <div>
      <div className="h-44 animate-pulse bg-secondary/40" />
      <div className="h-80 animate-pulse bg-secondary/40" />
      <div className="container-shell py-10">
        <DoctorResultsSkeleton />
      </div>
    </div>
  );
}

function parsePage(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}