"use client";

import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarCheck2,
  CalendarClock,
  CalendarPlus,
  ClipboardList,
  Clock3,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import {
  AppointmentStatusBadge,
  getAppointmentTypeLabel,
} from "@/components/appointments/appointment-ui";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/data-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatAppointmentDateTime, formatPrice, markdownToPlainText } from "@/lib/format";
import { appointmentService } from "@/lib/services/appointment/AppointmentService";
import { departmentService } from "@/lib/services/department/DepartmentService";
import { doctorService } from "@/lib/services/doctor/DoctorService";
import { medicalServiceService } from "@/lib/services/medical-service/MedicalServiceService";
import { cn } from "@/lib/utils";
import type {
  AppointmentPresentation,
  BookingContext,
} from "@/types/appointments";
import {
  type Department,
  type DoctorProfile,
  type MedicalService,
} from "@/types/models";
import { AppointmentStatus } from "@/types/models";

type FeaturedData = {
  departments: Department[];
  doctors: DoctorProfile[];
  services: MedicalService[];
};

type FeaturedState =
  | { status: "loading" }
  | { status: "success"; data: FeaturedData }
  | { status: "error"; message: string };

type AppointmentsState =
  | { status: "loading" }
  | { status: "success"; upcoming: AppointmentPresentation[]; recent: AppointmentPresentation[] }
  | { status: "error"; message: string };

type ContextState =
  | { status: "loading" }
  | { status: "success"; context: BookingContext }
  | { status: "error"; message: string };

export function PatientHomePage() {
  const { session } = useAuth();
  const [featured, setFeatured] = useState<FeaturedState>({ status: "loading" });
  const [context, setContext] = useState<ContextState>({ status: "loading" });
  const [appointments, setAppointments] = useState<AppointmentsState>({
    status: "loading",
  });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    Promise.all([
      departmentService.getFeatured(controller.signal),
      doctorService.getFeatured(controller.signal),
      medicalServiceService.getFeatured(controller.signal),
    ])
      .then(([departments, doctors, services]) => {
        if (!active) return;
        setFeatured({
          status: "success",
          data: {
            departments: departments.Data,
            doctors: doctors.Data,
            services: services.Data,
          },
        });
      })
      .catch(() => {
        if (!active) return;
        setFeatured({
          status: "error",
          message: "Không thể tải nội dung nổi bật. Vui lòng thử lại.",
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    appointmentService
      .getBookingContext(controller.signal)
      .then((response) => {
        if (!active) return;
        setContext({ status: "success", context: response.Data });
      })
      .catch(() => {
        if (!active) return;
        setContext({
          status: "error",
          message: "Không thể tải danh sách cơ sở. Vui lòng thử lại.",
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setAppointments({ status: "loading" });
      return;
    }
    const controller = new AbortController();
    let active = true;

    appointmentService
      .getAll(
        {
          accountUuid: session.Account.Uuid,
          status: AppointmentStatus.Approved,
          pageSize: 3,
        },
        controller.signal,
      )
      .then((response) => {
        if (!active) return;
        const upcoming = response.Data.Items;
        return appointmentService
          .getAll(
            {
              accountUuid: session.Account.Uuid,
              status: AppointmentStatus.Done,
              pageSize: 3,
            },
            controller.signal,
          )
          .then((doneResponse) => {
            if (!active) return;
            setAppointments({
              status: "success",
              upcoming,
              recent: doneResponse.Data.Items,
            });
          });
      })
      .catch(() => {
        if (!active) return;
        setAppointments({
          status: "error",
          message: "Không thể tải lịch hẹn của bạn. Vui lòng thử lại.",
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [session]);

  if (!session) return null;

  return (
    <div className="container-shell py-8 sm:py-12">
      <WelcomeBanner name={session.PatientProfile.Name} />

      <QuickActions />

      <section aria-labelledby="patient-upcoming-title" className="mt-10">
        <SectionTitle
          id="patient-upcoming-title"
          eyebrow="Lịch hẹn của tôi"
          title="Lịch hẹn sắp tới & gần đây"
          description="Theo dõi nhanh các lịch khám đã được duyệt và các lịch đã hoàn thành gần nhất."
          action={
            <Link
              href="/tai-khoan/lich-hen"
              className={cn(buttonVariants({ variant: "outline" }), "h-9 px-3")}
            >
              Xem tất cả
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          }
        />
        <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-2">
          <UpcomingColumn
            title="Đã duyệt · sắp tới"
            icon={CalendarCheck2}
            state={appointments}
          />
          <UpcomingColumn
            title="Đã hoàn thành · gần đây"
            icon={ClipboardList}
            state={appointments}
            variant="recent"
          />
        </div>
      </section>

      <section aria-labelledby="patient-featured-title" className="mt-12">
        <SectionTitle
          id="patient-featured-title"
          eyebrow="Gợi ý cho bạn"
          title="Khám phá nhanh"
          description="Chuyên khoa, bác sĩ và dịch vụ nổi bật để bạn chọn nhanh cách đặt lịch phù hợp."
        />
        {featured.status === "loading" ? (
          <div className="mt-6">
            <LoadingState label="Đang tải nội dung nổi bật" />
          </div>
        ) : null}
        {featured.status === "error" ? (
          <div className="mt-6">
            <ErrorState
              message={featured.message}
              onRetry={() => setFeatured({ status: "loading" })}
            />
          </div>
        ) : null}
        {featured.status === "success" ? (
          <div className="mt-6 grid min-w-0 gap-6">
            <DepartmentStrip departments={featured.data.departments} />
            <DoctorHighlightList doctors={featured.data.doctors} />
            <ServiceHighlightList services={featured.data.services} />
          </div>
        ) : null}
      </section>

      <section aria-labelledby="patient-context-title" className="mt-12">
        <SectionTitle
          id="patient-context-title"
          eyebrow="Mạng lưới chăm sóc"
          title="Chọn cơ sở đang hoạt động"
          description="Danh sách cơ sở y tế đang hoạt động để bạn đặt lịch nhanh."
          action={
            <Link
              href="/co-so-y-te"
              className={cn(buttonVariants({ variant: "outline" }), "h-9 px-3")}
            >
              Xem tất cả
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          }
        />
        <div className="mt-5">
          {context.status === "loading" ? (
            <LoadingState label="Đang tải cơ sở" />
          ) : null}
          {context.status === "error" ? (
            <ErrorState
              message={context.message}
              onRetry={() => setContext({ status: "loading" })}
            />
          ) : null}
          {context.status === "success" ? (
            <ContextHospitalList context={context.context} />
          ) : null}
        </div>
      </section>
    </div>
  );
}

function WelcomeBanner({ name }: { name: string }) {
  const greeting = getGreeting();
  return (
    <section className="overflow-hidden border border-primary/15 bg-gradient-to-br from-white to-[#eaf6fd] shadow-sm">
      <div className="grid items-center gap-6 p-6 sm:p-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles aria-hidden="true" className="size-3.5" />
            Khu vực Patient
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {greeting}, {name}!
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            Chào mừng bạn quay lại. Tại đây bạn có thể đặt lịch mới, theo dõi các lịch
            đang chờ và quản lý hồ sơ cá nhân trong cùng một tài khoản.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/co-so-y-te"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              <CalendarPlus aria-hidden="true" />
              Đặt lịch mới
            </Link>
            <Link
              href="/tai-khoan/lich-hen"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
            >
              <CalendarClock aria-hidden="true" />
              Lịch hẹn của tôi
            </Link>
          </div>
        </div>
        <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <BenefitItem
            icon={ShieldCheck}
            title="Bảo mật thông tin"
            description="Dữ liệu cá nhân chỉ dùng cho yêu cầu đặt lịch."
          />
          <BenefitItem
            icon={BadgeCheck}
            title="Trạng thái rõ ràng"
            description="Theo dõi phiếu khám theo từng giai đoạn."
          />
          <BenefitItem
            icon={HeartPulse}
            title="Chủ động chăm sóc"
            description="Lưu lại lịch sử và các lựa chọn phù hợp."
          />
        </ul>
      </div>
    </section>
  );
}

function BenefitItem({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
}) {
  return (
    <li className="flex min-w-0 items-start gap-3 rounded-xl border border-primary/10 bg-white/80 p-3 shadow-sm">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="font-semibold leading-6">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </li>
  );
}

function QuickActions() {
  const items = [
    {
      label: "Đặt tại cơ sở",
      description: "Chọn nơi khám thuận tiện",
      href: "/co-so-y-te",
      icon: Building2,
      border: "border-t-[#10a8e5]",
      tone: "bg-[#effaff] text-[#087fb8]",
    },
    {
      label: "Đặt theo bác sĩ",
      description: "Theo chuyên môn & nơi làm việc",
      href: "/bac-si",
      icon: Stethoscope,
      border: "border-t-[#34a889]",
      tone: "bg-[#ecfaf6] text-[#23866e]",
    },
    {
      label: "Đặt theo dịch vụ",
      description: "Chọn dịch vụ và cơ sở cung cấp",
      href: "/dich-vu",
      icon: ClipboardList,
      border: "border-t-[#f5a623]",
      tone: "bg-[#fff8e7] text-[#a56800]",
    },
  ];

  return (
    <section aria-labelledby="patient-quick-actions-title" className="mt-8">
      <h2 id="patient-quick-actions-title" className="sr-only">
        Đặt lịch nhanh
      </h2>
      <div className="grid min-w-0 gap-4 md:grid-cols-3">
        {items.map(({ label, description, href, icon: Icon, border, tone }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "group flex min-w-0 items-start gap-4 border border-t-4 bg-card p-5 transition hover:shadow-md sm:p-6",
              border,
            )}
          >
            <span
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-md",
                tone,
              )}
            >
              <Icon aria-hidden="true" className="size-6" />
            </span>
            <span className="min-w-0">
              <strong className="block text-base group-hover:text-primary">
                {label}
              </strong>
              <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                {description}
              </span>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Bắt đầu
                <ArrowRight aria-hidden="true" className="size-4" />
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function UpcomingColumn({
  title,
  icon: Icon,
  state,
  variant = "upcoming",
}: {
  title: string;
  icon: typeof CalendarCheck2;
  state: AppointmentsState;
  variant?: "upcoming" | "recent";
}) {
  return (
    <article className="flex min-w-0 flex-col rounded-xl border bg-card p-5">
      <header className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-semibold">
          <Icon aria-hidden="true" className="size-4 text-primary" />
          {title}
        </h3>
        <span className="text-xs text-muted-foreground">Tối đa 3 lịch</span>
      </header>
      <div className="mt-4 min-h-32">
        {state.status === "loading" ? (
          <LoadingState label="Đang tải lịch hẹn" />
        ) : null}
        {state.status === "error" ? (
          <ErrorState
            message={state.message}
            onRetry={() => location.reload()}
          />
        ) : null}
        {state.status === "success" ? (
          <AppointmentList
            items={variant === "upcoming" ? state.upcoming : state.recent}
            emptyMessage={
              variant === "upcoming"
                ? "Chưa có lịch đã duyệt. Hãy đặt lịch mới khi cần."
                : "Chưa có lịch hoàn thành nào được ghi nhận."
            }
          />
        ) : null}
      </div>
    </article>
  );
}

function AppointmentList({
  items,
  emptyMessage,
}: {
  items: AppointmentPresentation[];
  emptyMessage: string;
}) {
  if (!items.length) {
    return <EmptyState message={emptyMessage} />;
  }
  return (
    <ul className="grid min-w-0 gap-3">
      {items.map((item) => (
        <li key={item.Appointment.Uuid}>
          <Link
            href={`/tai-khoan/lich-hen/${item.Appointment.Uuid}`}
            className="group flex min-w-0 items-start gap-3 rounded-lg border bg-background/60 p-3 transition hover:border-primary/40 hover:shadow-sm"
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
              <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock3 aria-hidden="true" className="size-3.5" />
                  {formatAppointmentDateTime(item.Appointment.AppointmentAt)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Building2 aria-hidden="true" className="size-3.5" />
                  {item.HospitalName}
                </span>
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function SectionTitle({
  id,
  eyebrow,
  title,
  description,
  action,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold text-primary">{eyebrow}</p>
        <h2 id={id} className="mt-1 text-2xl font-bold tracking-tight">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}

function DepartmentStrip({ departments }: { departments: Department[] }) {
  if (!departments.length) {
    return <EmptyState message="Chưa có chuyên khoa nổi bật." />;
  }
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-semibold">
          <Stethoscope aria-hidden="true" className="size-4 text-primary" />
          Chuyên khoa thường gặp
        </h3>
        <Link
          href="/bac-si"
          className="text-sm font-semibold text-primary hover:underline"
        >
          Xem bác sĩ
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {departments.map((department) => (
          <Link
            key={department.Uuid}
            href={`/bac-si?department=${department.Uuid}`}
            className="group flex min-w-0 items-center gap-3 rounded-xl border bg-card p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-md"
          >
            <Image
              src={department.Icon}
              alt=""
              width={48}
              height={48}
              className="size-12 shrink-0 rounded-lg"
            />
            <span className="min-w-0">
              <span className="block break-words font-semibold leading-6 group-hover:text-primary">
                {department.Name}
              </span>
              <span className="block text-xs leading-5 text-muted-foreground">
                Tìm bác sĩ theo chuyên khoa
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function DoctorHighlightList({ doctors }: { doctors: DoctorProfile[] }) {
  if (!doctors.length) {
    return <EmptyState message="Chưa có bác sĩ nổi bật." />;
  }
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-semibold">
          <UserRound aria-hidden="true" className="size-4 text-primary" />
          Bác sĩ nổi bật
        </h3>
        <Link
          href="/bac-si"
          className="text-sm font-semibold text-primary hover:underline"
        >
          Xem tất cả
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {doctors.slice(0, 3).map((doctor) => (
          <article
            key={doctor.Uuid}
            className="flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md"
          >
            <div className="relative aspect-[16/9] bg-muted">
              <Image
                src={doctor.Avatar}
                alt={`Bác sĩ ${doctor.Name}`}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="flex flex-1 flex-col p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {doctor.DepartmentDisplay}
              </p>
              <h4 className="mt-1 break-words text-base font-semibold">
                {doctor.Name}
              </h4>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                {doctor.Specialty}
              </p>
              <p className="mt-3 text-sm font-semibold">
                {formatPrice(doctor.Price)}
              </p>
              <div className="mt-auto flex gap-2 pt-4">
                <Link
                  href={`/bac-si/${doctor.Slug}`}
                  className={cn(buttonVariants({ variant: "outline" }), "flex-1")}
                >
                  Xem hồ sơ
                </Link>
                <Link
                  href={`/dat-lich/bac-si?doctor=${doctor.Uuid}`}
                  className={cn(buttonVariants(), "flex-1")}
                >
                  Đặt lịch
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ServiceHighlightList({ services }: { services: MedicalService[] }) {
  if (!services.length) {
    return <EmptyState message="Chưa có dịch vụ nổi bật." />;
  }
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-semibold">
          <ClipboardList aria-hidden="true" className="size-4 text-primary" />
          Dịch vụ nổi bật
        </h3>
        <Link
          href="/dich-vu"
          className="text-sm font-semibold text-primary hover:underline"
        >
          Xem tất cả
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.slice(0, 3).map((service) => (
          <article
            key={service.Uuid}
            className="flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md"
          >
            <div className="relative aspect-[16/9] bg-muted">
              <Image
                src={service.Image}
                alt={`Minh họa ${service.Name}`}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h4 className="break-words text-base font-semibold leading-6">
                {service.Name}
              </h4>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                {markdownToPlainText(service.Description) || "Đang cập nhật"}
              </p>
              <p className="mt-3 text-sm font-semibold">
                {formatPrice(service.Price)}
              </p>
              <div className="mt-auto flex gap-2 pt-4">
                <Link
                  href={`/dich-vu/${service.Slug}`}
                  className={cn(buttonVariants({ variant: "outline" }), "flex-1")}
                >
                  Xem chi tiết
                </Link>
                <Link
                  href={`/dat-lich/dich-vu?service=${service.Uuid}`}
                  className={cn(buttonVariants(), "flex-1")}
                >
                  Đặt lịch
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ContextHospitalList({ context }: { context: BookingContext }) {
  if (!context.Hospitals.length) {
    return <EmptyState message="Chưa có cơ sở đang hoạt động." />;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {context.Hospitals.slice(0, 6).map((hospital) => (
        <article
          key={hospital.Uuid}
          className="flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md"
        >
          <div className="relative aspect-[16/9] bg-muted">
            <Image
              src={hospital.Image}
              alt={`Hình minh họa ${hospital.Name}`}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-1 flex-col p-4">
            <h4 className="break-words text-base font-semibold leading-6">
              {hospital.Name}
            </h4>
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
              {hospital.Address}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock3 aria-hidden="true" className="size-3.5" />
              {hospital.WorkingHour}
            </p>
            <div className="mt-auto flex gap-2 pt-4">
              <Link
                href={`/co-so-y-te/${hospital.Slug}`}
                className={cn(buttonVariants({ variant: "outline" }), "flex-1")}
              >
                Xem chi tiết
              </Link>
              <Link
                href={`/dat-lich/co-so-y-te?hospital=${hospital.Uuid}`}
                className={cn(buttonVariants(), "flex-1")}
              >
                Đặt lịch
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Chào buổi đêm";
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 14) return "Chào buổi trưa";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}