"use client";

import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Check,
  Clock3,
  DoorOpen,
  LoaderCircle,
  MapPin,
  Stethoscope,
  UserRoundCheck,
  WalletCards,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { genderOptions } from "@/lib/auth/options";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/data-state";
import { SafeMarkdown } from "@/components/shared/safe-markdown";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getVietnamToday,
  toAppointmentIso,
} from "@/lib/booking/working-hours";
import { formatAppointmentDateTime, formatPrice } from "@/lib/format";
import {
  AppointmentServiceError,
  appointmentService,
} from "@/lib/services/appointment/AppointmentService";
import { cn } from "@/lib/utils";
import type { Availability, BookingContext, BookingType } from "@/types/appointments";
import {
  Gender,
  type DoctorProfile,
  type Hospital,
  type MedicalService,
} from "@/types/models";

type ContextState =
  | { status: "loading" }
  | { status: "success"; data: BookingContext }
  | { status: "error"; message: string };

type AvailabilityState =
  | { status: "idle" }
  | { status: "success"; key: string; data: Availability }
  | { status: "error"; key: string; message: string };

export function HospitalBookingFlow() {
  return <SelectedTargetBookingFlow type="hospital" />;
}

export function DoctorBookingFlow() {
  return <SelectedTargetBookingFlow type="doctor" />;
}

export function MedicalServiceBookingFlow() {
  return <SelectedTargetBookingFlow type="medical-service" />;
}

function SelectedTargetBookingFlow({ type }: { type: BookingType }) {
  const { session } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetParamName = type === "hospital" ? "hospital" : type === "doctor" ? "doctor" : "service";
  const targetParam = searchParams.get(targetParamName) || "";
  const hospitalParam = searchParams.get("hospital") || "";
  const [contextAttempt, setContextAttempt] = useState(0);
  const [availabilityAttempt, setAvailabilityAttempt] = useState(0);
  const [context, setContext] = useState<ContextState>({ status: "loading" });
  const [availability, setAvailability] = useState<AvailabilityState>({
    status: "idle",
  });
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [patientName, setPatientName] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [medicalCode, setMedicalCode] = useState("");
  const [note, setNote] = useState("");
  const [step, setStep] = useState<"form" | "review">("form");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLock = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    appointmentService
      .getBookingContext(controller.signal)
      .then((response) => {
        if (active) setContext({ status: "success", data: response.Data });
      })
      .catch(() => {
        if (active) {
          setContext({
            status: "error",
            message: "Không thể tải thông tin đặt lịch. Vui lòng thử lại.",
          });
        }
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [contextAttempt]);

  const selectedTarget =
    context.status === "success"
      ? (type === "hospital"
          ? context.data.Hospitals
          : type === "doctor"
            ? context.data.Doctors
            : context.data.MedicalServices
        ).find(
          (item) => item.Uuid === targetParam || item.Slug === targetParam,
        ) ?? null
      : null;
  const doctor = type === "doctor" ? selectedTarget as DoctorProfile | null : null;
  const medicalService = type === "medical-service"
    ? selectedTarget as MedicalService | null
    : null;
  const serviceHospitals =
    context.status === "success" && medicalService
      ? context.data.Hospitals.filter((item) =>
          context.data.HospitalMedicalServices.some(
            (relation) =>
              relation.HospitalUuid === item.Uuid &&
              relation.MedicalServiceUuid === medicalService.Uuid,
          ),
        )
      : [];
  const hospital =
    type === "hospital"
      ? selectedTarget as Hospital | null
      : type === "doctor" && context.status === "success" && doctor
        ? context.data.Hospitals.find((item) => item.Uuid === doctor.HospitalUuid) ?? null
        : type === "medical-service"
          ? serviceHospitals.find(
              (item) => item.Uuid === hospitalParam || item.Slug === hospitalParam,
            ) ?? null
          : null;

  useEffect(() => {
    if (
      context.status === "success" &&
      (!selectedTarget || (type === "doctor" && !hospital))
    ) {
      router.replace(
        type === "hospital" ? "/co-so-y-te" : type === "doctor" ? "/bac-si" : "/dich-vu",
      );
    }
  }, [context.status, hospital, router, selectedTarget, type]);

  const availabilityKey = selectedTarget && hospital && date
    ? `${type}:${selectedTarget.Uuid}:${hospital.Uuid}:${date}:${availabilityAttempt}`
    : "";

  useEffect(() => {
    if (!session || !selectedTarget || !hospital || !date) return;
    const controller = new AbortController();
    let active = true;
    const key = `${type}:${selectedTarget.Uuid}:${hospital.Uuid}:${date}:${availabilityAttempt}`;
    appointmentService
      .getAvailability(
        {
          type,
          targetUuid: selectedTarget.Uuid,
          hospitalUuid: hospital.Uuid,
          accountUuid: session.Account.Uuid,
          date,
        },
        controller.signal,
      )
      .then((response) => {
        if (active) setAvailability({ status: "success", key, data: response.Data });
      })
      .catch((error) => {
        if (!active) return;
        setAvailability({
          status: "error",
          key,
          message:
            error instanceof AppointmentServiceError
              ? error.message
              : "Không thể tải thời gian khả dụng.",
        });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [availabilityAttempt, date, hospital, selectedTarget, session, type]);

  if (!session) return null;
  if (context.status === "loading") {
    return (
      <div className="container-shell py-12">
        <LoadingState label="Đang chuẩn bị thông tin đặt lịch" />
      </div>
    );
  }
  if (context.status === "error") {
    return (
      <div className="container-shell py-12">
        <ErrorState
          message={context.message}
          onRetry={() => {
            setContext({ status: "loading" });
            setContextAttempt((value) => value + 1);
          }}
        />
      </div>
    );
  }
  if (!selectedTarget || (type !== "medical-service" && !hospital)) {
    return (
      <div className="container-shell py-12">
        <LoadingState
          label={`Đang chuyển về danh sách ${type === "hospital" ? "cơ sở" : type === "doctor" ? "bác sĩ" : "dịch vụ"}`}
        />
      </div>
    );
  }

  const currentSession = session;
  const selectedTargetEntity = selectedTarget;
  const selectedHospital = hospital;
  const selectedDoctor = doctor;
  const selectedMedicalService = medicalService;

  const currentAvailability =
    availability.status === "success" && availability.key === availabilityKey
      ? availability.data
      : null;
  const availabilityError =
    availability.status === "error" && availability.key === availabilityKey
      ? availability.message
      : "";

  function continueToReview() {
    setFormError("");
    if (!patientName.trim() || !gender || !medicalCode.trim()) {
      setFormError("Vui lòng điền đầy đủ thông tin người khám.");
      return;
    }
    if (patientName.trim().length > 100) {
      setFormError("Họ và tên tối đa 100 ký tự.");
      return;
    }
    if (medicalCode.trim().length > 50) {
      setFormError("Mã y tế tối đa 50 ký tự.");
      return;
    }
    if (!date || !time) {
      setFormError("Vui lòng chọn đầy đủ ngày và giờ khám.");
      return;
    }
    if (!selectedHospital) {
      setFormError("Vui lòng chọn cơ sở thực hiện dịch vụ.");
      return;
    }
    if (
      !currentAvailability?.Slots.some(
        (slot) => slot.Time === time && slot.IsAvailable,
      )
    ) {
      setFormError("Thời gian đã chọn không còn khả dụng.");
      return;
    }
    if (note.trim().length > 500) {
      setFormError("Ghi chú tối đa 500 ký tự.");
      return;
    }
    setStep("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function confirmAppointment() {
    if (submitLock.current || !date || !time || !selectedHospital) return;
    submitLock.current = true;
    setIsSubmitting(true);
    setFormError("");
    try {
      const common = {
        PatientName: patientName.trim(),
        Gender: gender,
        Note: note.trim(),
        MedicalCode: medicalCode.trim(),
        AppointmentAt: toAppointmentIso(date, time),
        AccountUuid: currentSession.Account.Uuid,
        HospitalUuid: selectedHospital.Uuid,
      };
      await appointmentService.create(
        type === "hospital"
          ? { ...common, Type: "hospital" }
          : type === "doctor"
            ? { ...common, Type: "doctor", DoctorUuid: selectedTargetEntity.Uuid }
            : {
                ...common,
                Type: "medical-service",
                MedicalServiceUuid: selectedTargetEntity.Uuid,
              },
      );
      router.replace("/tai-khoan/lich-hen");
    } catch (error) {
      if (
        error instanceof AppointmentServiceError &&
        error.code === "SLOT_CONFLICT"
      ) {
        setFormError(error.message);
        setTime("");
        setStep("form");
        setAvailabilityAttempt((value) => value + 1);
      } else {
        setFormError(
          error instanceof AppointmentServiceError
            ? error.message
            : "Không thể đặt lịch. Vui lòng thử lại.",
        );
      }
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container-shell py-8 sm:py-12">
      <Link
        href={type === "hospital" ? "/co-so-y-te" : type === "doctor" ? "/bac-si" : "/dich-vu"}
        className={cn(buttonVariants({ variant: "ghost" }), "-ml-2")}
      >
        <ArrowLeft aria-hidden="true" />
        Chọn {type === "hospital" ? "cơ sở" : type === "doctor" ? "bác sĩ" : "dịch vụ"} khác
      </Link>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">
            {type === "hospital"
              ? "Đặt lịch tại cơ sở"
              : type === "doctor"
                ? "Đặt lịch với bác sĩ"
                : "Đặt lịch dịch vụ y tế"}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {step === "form" ? "Điền thông tin đặt lịch" : "Kiểm tra phiếu đặt lịch"}
          </h1>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <StepBadge number={1} label="Thông tin" active={step === "form"} done={step === "review"} />
          <span className="h-px w-6 bg-border" />
          <StepBadge number={2} label="Xác nhận" active={step === "review"} />
        </div>
      </div>

      <div className="mt-7 grid min-w-0 gap-6 lg:grid-cols-[minmax(19rem,0.8fr)_minmax(0,1.2fr)] xl:grid-cols-[minmax(22rem,0.8fr)_minmax(0,1.2fr)]">
        {selectedDoctor && selectedHospital ? (
          <DoctorSummary doctor={selectedDoctor} hospital={selectedHospital} />
        ) : selectedMedicalService ? (
          <MedicalServiceSummary service={selectedMedicalService} />
        ) : selectedHospital ? (
          <HospitalSummary hospital={selectedHospital} />
        ) : null}

        <section className="min-w-0 border border-t-4 border-t-primary bg-card p-5 sm:p-7">
          {formError ? (
            <p
              role="alert"
              className="mb-5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {formError}
            </p>
          ) : null}

          {step === "form" ? (
            <BookingForm
              patientName={patientName}
              gender={gender}
              medicalCode={medicalCode}
              date={date}
              time={time}
              note={note}
              hospitalOptions={type === "medical-service" ? serviceHospitals : []}
              hospitalUuid={selectedHospital?.Uuid || ""}
              availability={currentAvailability}
              availabilityError={availabilityError}
              isLoadingAvailability={Boolean(selectedHospital && date) && !currentAvailability && !availabilityError}
              onHospitalChange={(value) => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("hospital", value);
                setDate("");
                setTime("");
                setFormError("");
                router.replace(`/dat-lich/dich-vu?${params.toString()}`, { scroll: false });
              }}
              onDateChange={(value) => {
                setDate(value);
                setTime("");
                setFormError("");
              }}
              onTimeChange={(value) => {
                setTime(value);
                setFormError("");
              }}
              onNoteChange={setNote}
              onPatientNameChange={setPatientName}
              onGenderChange={setGender}
              onMedicalCodeChange={setMedicalCode}
              onFillFromAccount={() => {
                setPatientName(currentSession.PatientProfile.Name);
                setGender(currentSession.PatientProfile.Gender);
                setMedicalCode(currentSession.PatientProfile.MedicalCode);
                setFormError("");
              }}
              onRetryAvailability={() =>
                setAvailabilityAttempt((value) => value + 1)
              }
              onNext={continueToReview}
            />
          ) : selectedHospital ? (
            <AppointmentReview
              hospital={selectedHospital}
              doctor={selectedDoctor}
              medicalService={selectedMedicalService}
              patientName={patientName.trim()}
              gender={getGenderLabel(gender)}
              medicalCode={medicalCode.trim()}
              appointmentAt={toAppointmentIso(date, time)}
              note={note}
              isSubmitting={isSubmitting}
              onBack={() => {
                setFormError("");
                setStep("form");
              }}
              onConfirm={confirmAppointment}
            />
          ) : null}
        </section>
      </div>
    </div>
  );
}

function HospitalSummary({ hospital }: { hospital: Hospital }) {
  return (
    <aside className="self-start overflow-hidden border border-t-4 border-t-primary bg-card lg:sticky lg:top-32">
      <div className="relative aspect-[16/9] bg-muted">
        <Image
          src={hospital.Image}
          alt={`Hình minh họa ${hospital.Name}`}
          fill
          sizes="(min-width: 1024px) 36vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Cơ sở đã chọn
        </p>
        <h2 className="mt-2 text-xl font-bold leading-7">{hospital.Name}</h2>
        <HospitalFact icon={MapPin} value={hospital.Address} />
        <HospitalFact icon={Clock3} value={hospital.WorkingHour} />
        <HospitalFact icon={DoorOpen} value={`${hospital.NumberOfRoom} phòng`} />
        <div className="mt-5 border-t pt-5 text-sm">
          <SafeMarkdown content={hospital.Description} showImages={false} />
        </div>
        <Link
          href={`/co-so-y-te/${hospital.Slug}`}
          className="mt-5 inline-flex text-sm font-semibold text-primary hover:underline"
        >
          Xem chi tiết cơ sở
        </Link>
      </div>
    </aside>
  );
}

function DoctorSummary({
  doctor,
  hospital,
}: {
  doctor: DoctorProfile;
  hospital: Hospital;
}) {
  return (
    <aside className="self-start overflow-hidden border border-t-4 border-t-primary bg-card lg:sticky lg:top-32">
      <div className="relative aspect-[16/9] bg-muted">
        <Image
          src={doctor.Avatar}
          alt={`Bác sĩ ${doctor.Name}`}
          fill
          sizes="(min-width: 1024px) 36vw, 100vw"
          className="object-cover object-top"
        />
      </div>
      <div className="p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Bác sĩ đã chọn
        </p>
        <h2 className="mt-2 text-xl font-bold leading-7">{doctor.Name}</h2>
        <HospitalFact icon={Stethoscope} value={doctor.Specialty || doctor.DepartmentDisplay} />
        <HospitalFact icon={Building2} value={hospital.Name} />
        <HospitalFact icon={MapPin} value={doctor.Workplace || hospital.Address} />
        <HospitalFact icon={WalletCards} value={`Phí khám: ${formatPrice(doctor.Price)}`} />
        <div className="mt-5 border-t pt-5 text-sm">
          <SafeMarkdown content={doctor.Introduction} showImages={false} />
        </div>
        <Link
          href={`/bac-si/${doctor.Slug}`}
          className="mt-5 inline-flex text-sm font-semibold text-primary hover:underline"
        >
          Xem chi tiết bác sĩ
        </Link>
      </div>
    </aside>
  );
}

function MedicalServiceSummary({ service }: { service: MedicalService }) {
  return (
    <aside className="self-start overflow-hidden border border-t-4 border-t-primary bg-card lg:sticky lg:top-32">
      <div className="relative aspect-[16/9] bg-muted">
        <Image
          src={service.Image}
          alt={`Dịch vụ ${service.Name}`}
          fill
          sizes="(min-width: 1024px) 36vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Dịch vụ đã chọn
        </p>
        <h2 className="mt-2 text-xl font-bold leading-7">{service.Name}</h2>
        <HospitalFact icon={Clock3} value={service.WorkingHour} />
        <HospitalFact icon={WalletCards} value={`Chi phí: ${formatPrice(service.Price)}`} />
        <div className="mt-5 border-t pt-5 text-sm">
          <SafeMarkdown content={service.Description} showImages={false} />
        </div>
        <Link
          href={`/dich-vu/${service.Slug}`}
          className="mt-5 inline-flex text-sm font-semibold text-primary hover:underline"
        >
          Xem chi tiết dịch vụ
        </Link>
      </div>
    </aside>
  );
}

function BookingForm({
  patientName,
  gender,
  medicalCode,
  date,
  time,
  note,
  hospitalOptions,
  hospitalUuid,
  availability,
  availabilityError,
  isLoadingAvailability,
  onHospitalChange,
  onDateChange,
  onTimeChange,
  onNoteChange,
  onPatientNameChange,
  onGenderChange,
  onMedicalCodeChange,
  onFillFromAccount,
  onRetryAvailability,
  onNext,
}: {
  patientName: string;
  gender: Gender | "";
  medicalCode: string;
  date: string;
  time: string;
  note: string;
  hospitalOptions: Hospital[];
  hospitalUuid: string;
  availability: Availability | null;
  availabilityError: string;
  isLoadingAvailability: boolean;
  onHospitalChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onPatientNameChange: (value: string) => void;
  onGenderChange: (value: Gender | "") => void;
  onMedicalCodeChange: (value: string) => void;
  onFillFromAccount: () => void;
  onRetryAvailability: () => void;
  onNext: () => void;
}) {
  const slots = availability?.Slots.filter((slot) => slot.IsAvailable) ?? [];
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Thông tin người khám</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Điền thông tin dùng trên phiếu khám hoặc lấy nhanh từ tài khoản của bạn.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={onFillFromAccount}>
          <UserRoundCheck aria-hidden="true" />
          Điền từ tài khoản
        </Button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="hospital-patient-name">Họ và tên người khám</Label>
          <Input
            id="hospital-patient-name"
            value={patientName}
            maxLength={100}
            autoComplete="name"
            placeholder="Nhập họ và tên"
            onChange={(event) => onPatientNameChange(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hospital-patient-gender">Giới tính</Label>
          <Select
            items={genderOptions}
            value={gender || null}
            onValueChange={(value) => onGenderChange((value as Gender) || "")}
          >
            <SelectTrigger id="hospital-patient-gender" className="w-full">
              <SelectValue placeholder="Chọn giới tính" />
            </SelectTrigger>
            <SelectContent>
              {genderOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="hospital-medical-code">Mã y tế</Label>
          <Input
            id="hospital-medical-code"
            value={medicalCode}
            maxLength={50}
            placeholder="Nhập mã y tế"
            onChange={(event) => onMedicalCodeChange(event.target.value)}
          />
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {hospitalOptions.length ? (
          <div className="space-y-2">
            <Label htmlFor="service-hospital">Cơ sở thực hiện</Label>
            <Select
              items={hospitalOptions.map((hospital) => ({
                value: hospital.Uuid,
                label: hospital.Name,
              }))}
              value={hospitalUuid || null}
              onValueChange={(value) => value && onHospitalChange(value)}
            >
              <SelectTrigger id="service-hospital" className="w-full">
                <SelectValue placeholder="Chọn cơ sở thực hiện dịch vụ" />
              </SelectTrigger>
              <SelectContent>
                {hospitalOptions.map((hospital) => (
                  <SelectItem key={hospital.Uuid} value={hospital.Uuid}>
                    {hospital.Name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="max-w-sm space-y-2">
          <Label htmlFor="hospital-appointment-date">Ngày khám</Label>
          <Input
            id="hospital-appointment-date"
            type="date"
            min={getVietnamToday()}
            max={addDays(getVietnamToday(), 14)}
            value={date}
            disabled={hospitalOptions.length > 0 && !hospitalUuid}
            onChange={(event) => onDateChange(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">Có thể chọn lịch trong 14 ngày tới.</p>
        </div>

        {isLoadingAvailability ? (
          <LoadingState label="Đang tải giờ khám khả dụng" />
        ) : null}
        {availabilityError ? (
          <ErrorState message={availabilityError} onRetry={onRetryAvailability} />
        ) : null}
        {availability ? (
          slots.length ? (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label>Giờ khám</Label>
                <span className="text-xs text-muted-foreground">
                  Khung giờ: {availability.WorkingHour}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {slots.map((slot) => (
                  <Button
                    key={slot.AppointmentAt}
                    type="button"
                    variant={time === slot.Time ? "default" : "outline"}
                    onClick={() => onTimeChange(slot.Time)}
                  >
                    {slot.Time}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState message="Ngày này chưa còn giờ khám khả dụng." />
          )
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="hospital-booking-note">Ghi chú cho cơ sở</Label>
          <Textarea
            id="hospital-booking-note"
            value={note}
            maxLength={500}
            placeholder="Triệu chứng chính, nhu cầu hỗ trợ hoặc thông tin cần lưu ý..."
            onChange={(event) => onNoteChange(event.target.value)}
          />
          <p className="text-right text-xs text-muted-foreground">{note.length}/500</p>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          type="button"
          size="lg"
          disabled={
            !patientName.trim() ||
            !gender ||
            !medicalCode.trim() ||
            (hospitalOptions.length > 0 && !hospitalUuid) ||
            !date ||
            !time
          }
          onClick={onNext}
        >
          Tiếp theo
          <CalendarDays aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

function AppointmentReview({
  hospital,
  doctor,
  medicalService,
  patientName,
  gender,
  medicalCode,
  appointmentAt,
  note,
  isSubmitting,
  onBack,
  onConfirm,
}: {
  hospital: Hospital;
  doctor: DoctorProfile | null;
  medicalService: MedicalService | null;
  patientName: string;
  gender: string;
  medicalCode: string;
  appointmentAt: string;
  note: string;
  isSubmitting: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <div>
      <div className="flex items-start gap-3 border-b pb-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Check aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2 className="text-xl font-bold">Phiếu đặt lịch khám</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Kiểm tra kỹ thông tin trước khi xác nhận. Lịch sau khi tạo sẽ ở trạng thái chờ duyệt.
          </p>
        </div>
      </div>

      <dl className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2">
        {doctor ? <ReviewField label="Bác sĩ" value={doctor.Name} /> : null}
        {medicalService ? (
          <ReviewField label="Dịch vụ" value={medicalService.Name} />
        ) : null}
        <ReviewField label="Cơ sở y tế" value={hospital.Name} />
        <ReviewField label="Thời gian khám" value={formatAppointmentDateTime(appointmentAt)} />
        <ReviewField label="Người khám" value={patientName} />
        <ReviewField label="Giới tính" value={gender} />
        <ReviewField label="Mã y tế" value={medicalCode} />
        <ReviewField label="Trạng thái sau khi tạo" value="Chờ duyệt" />
        <div className="sm:col-span-2">
          <ReviewField label="Địa chỉ" value={hospital.Address} />
        </div>
        <div className="sm:col-span-2">
          <ReviewField label="Ghi chú" value={note.trim() || "Không có"} />
        </div>
      </dl>

      <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" size="lg" disabled={isSubmitting} onClick={onBack}>
          Quay lại chỉnh sửa
        </Button>
        <Button type="button" size="lg" disabled={isSubmitting} onClick={onConfirm}>
          {isSubmitting ? (
            <>
              <LoaderCircle aria-hidden="true" className="animate-spin" />
              Đang xác nhận...
            </>
          ) : (
            "Xác nhận đặt lịch"
          )}
        </Button>
      </div>
    </div>
  );
}

function StepBadge({
  number,
  label,
  active,
  done = false,
}: {
  number: number;
  label: string;
  active: boolean;
  done?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-muted-foreground",
        active && "font-semibold text-foreground",
      )}
      aria-current={active ? "step" : undefined}
    >
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-full border text-xs font-bold",
          (active || done) && "border-primary bg-primary text-primary-foreground",
        )}
      >
        {done ? <Check aria-hidden="true" className="size-4" /> : number}
      </span>
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}

function HospitalFact({
  icon: Icon,
  value,
}: {
  icon: typeof Building2;
  value: string;
}) {
  return (
    <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-muted-foreground">
      <Icon aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" />
      <span>{value}</span>
    </p>
  );
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-l-2 border-primary/30 pl-3">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold leading-6">{value}</dd>
    </div>
  );
}

function getGenderLabel(value: Gender | "") {
  if (value === "Male") return "Nam";
  if (value === "Female") return "Nữ";
  return "Khác";
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00+07:00`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
