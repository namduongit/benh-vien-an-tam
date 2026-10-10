"use client";

import { Check, LoaderCircle, UserRoundCheck } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { genderOptions } from "@/lib/auth/options";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/data-state";
import { Button } from "@/components/ui/button";
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
import { formatAppointmentDateTime } from "@/lib/format";
import type { AsyncState } from "@/lib/http/response";
import {
  AppointmentServiceError,
  appointmentService,
} from "@/lib/services/appointment/AppointmentService";
import type {
  Availability,
  BookingContext,
  BookingType,
  CreateAppointmentRequest,
} from "@/types/appointments";
import { Gender } from "@/types/models";

const stepNames = ["context", "schedule", "patient", "review"] as const;
const stepLabels = [
  "Đối tượng khám",
  "Ngày và giờ",
  "Người khám",
  "Kiểm tra lại",
];

type AvailabilityState =
  | { status: "idle" }
  | { status: "loading"; key: string }
  | { status: "success"; key: string; data: Availability }
  | { status: "error"; key: string; message: string };

export function BookingWizard({ type }: { type: BookingType }) {
  const { session } = useAuth();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [contextAttempt, setContextAttempt] = useState(0);
  const [availabilityAttempt, setAvailabilityAttempt] = useState(0);
  const [contextState, setContextState] = useState<AsyncState<BookingContext>>({
    status: "loading",
  });
  const [availabilityState, setAvailabilityState] =
    useState<AvailabilityState>({ status: "idle" });
  const [patientName, setPatientName] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [medicalCode, setMedicalCode] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLock = useRef(false);

  const currentParams = searchParams.toString();
  const targetParam = getTargetParam(type);
  const targetValue = searchParams.get(targetParam) || "";
  const hospitalValue = searchParams.get("hospital") || "";
  const date = searchParams.get("date") || "";
  const time = searchParams.get("time") || "";
  const requestedStep = stepNames.indexOf(
    searchParams.get("step") as (typeof stepNames)[number],
  );

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    appointmentService
      .getBookingContext(controller.signal)
      .then((response) => {
        if (!cancelled) setContextState({ status: "success", data: response.Data });
      })
      .catch(() => {
        if (!cancelled) {
          setContextState({
            status: "error",
            message: "Không thể tải thông tin đặt lịch. Vui lòng thử lại.",
          });
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [contextAttempt]);

  const selection =
    contextState.status === "success"
      ? resolveSelection(
          type,
          contextState.data,
          targetValue,
          hospitalValue,
        )
      : null;
  const resolvedTargetValue =
    contextState.status === "success"
      ? resolveTargetUuid(type, contextState.data, targetValue)
      : "";
  const availabilityKey = selection && date
    ? `${type}:${selection.targetUuid}:${selection.hospital.Uuid}:${date}:${availabilityAttempt}`
    : "";
  const selectedTargetUuid = selection?.targetUuid || "";
  const selectedHospitalUuid = selection?.hospital.Uuid || "";

  useEffect(() => {
    if (!selectedTargetUuid || !selectedHospitalUuid || !date || !session) return;
    const controller = new AbortController();
    let cancelled = false;
    const key = `${type}:${selectedTargetUuid}:${selectedHospitalUuid}:${date}:${availabilityAttempt}`;

    appointmentService
      .getAvailability(
        {
          type,
          targetUuid: selectedTargetUuid,
          hospitalUuid: selectedHospitalUuid,
          accountUuid: session.Account.Uuid,
          date,
        },
        controller.signal,
      )
      .then((response) => {
        if (!cancelled) {
          setAvailabilityState({ status: "success", key, data: response.Data });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setAvailabilityState({
            status: "error",
            key,
            message:
              error instanceof AppointmentServiceError
                ? error.message
                : "Không thể tải thời gian khả dụng.",
          });
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [
    availabilityAttempt,
    date,
    selectedHospitalUuid,
    selectedTargetUuid,
    session,
    type,
  ]);

  const activeSession = session;
  if (!activeSession) return null;
  if (contextState.status === "idle" || contextState.status === "loading") {
    return (
      <div className="container-shell py-10">
        <LoadingState label="Đang chuẩn bị thông tin đặt lịch" />
      </div>
    );
  }
  if (contextState.status === "error") {
    return (
      <div className="container-shell py-10">
        <ErrorState
          message={contextState.message}
          onRetry={() => {
            setContextState({ status: "loading" });
            setContextAttempt((current) => current + 1);
          }}
        />
      </div>
    );
  }

  const hasSchedule = Boolean(
    date && /^\d{2}:\d{2}$/.test(time) && selection,
  );
  const patientInfoError = getPatientInfoError(patientName, gender, medicalCode);
  const activeStep = !selection
    ? 0
    : !hasSchedule && requestedStep > 1
      ? 1
      : patientInfoError && requestedStep > 2
        ? 2
      : requestedStep >= 0
        ? requestedStep
        : 0;
  const availability =
    availabilityState.status === "success" &&
    availabilityState.key === availabilityKey
      ? availabilityState.data
      : null;

  function updateUrl(
    updates: Record<string, string | null>,
    mode: "push" | "replace" = "push",
  ) {
    const params = new URLSearchParams(currentParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    const href = `${pathname}?${params.toString()}`;
    if (mode === "replace") router.replace(href, { scroll: false });
    else router.push(href, { scroll: false });
  }

  function chooseTarget(value: string) {
    const updates: Record<string, string | null> = {
      [targetParam]: value,
      date: null,
      time: null,
      step: "context",
    };
    if (type === "medical-service") updates.hospital = null;
    updateUrl(updates, "replace");
    setFormError("");
  }

  function goToStep(index: number) {
    updateUrl({ step: stepNames[index] });
    setFormError("");
  }

  async function submitAppointment() {
    const currentSession = activeSession;
    if (
      !currentSession ||
      !selection ||
      !date ||
      !time ||
      submitLock.current
    ) {
      return;
    }
    const currentPatientInfoError = getPatientInfoError(
      patientName,
      gender,
      medicalCode,
    );
    if (currentPatientInfoError) {
      goToStep(2);
      setFormError(currentPatientInfoError);
      return;
    }
    submitLock.current = true;
    setIsSubmitting(true);
    setFormError("");

    const common = {
      PatientName: patientName.trim(),
      Gender: gender,
      Note: note.trim(),
      MedicalCode: medicalCode.trim(),
      AppointmentAt: toAppointmentIso(date, time),
      AccountUuid: currentSession.Account.Uuid,
      HospitalUuid: selection.hospital.Uuid,
    };
    const request: CreateAppointmentRequest =
      type === "hospital"
        ? { ...common, Type: "hospital" }
        : type === "doctor"
          ? { ...common, Type: "doctor", DoctorUuid: selection.targetUuid }
          : {
              ...common,
              Type: "medical-service",
              MedicalServiceUuid: selection.targetUuid,
            };

    let submitted = false;
    try {
      const response = await appointmentService.create(request);
      submitted = true;
      router.push(`/dat-lich/xac-nhan?appointment=${response.Data.Uuid}`);
    } catch (error) {
      if (
        error instanceof AppointmentServiceError &&
        error.code === "SLOT_CONFLICT"
      ) {
        setFormError(error.message);
        setAvailabilityAttempt((current) => current + 1);
        updateUrl({ step: "schedule", time: null });
      } else {
        setFormError(
          error instanceof AppointmentServiceError
            ? error.message
            : "Không thể gửi yêu cầu đặt lịch. Vui lòng thử lại.",
        );
      }
    } finally {
      if (!submitted) {
        submitLock.current = false;
        setIsSubmitting(false);
      }
    }
  }

  return (
    <div className="container-shell py-10 sm:py-14">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold text-primary">Đặt lịch khám</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          {getBookingTitle(type)}
        </h1>
        <p className="mt-3 leading-7 text-muted-foreground">
          Chọn thông tin phù hợp và gửi yêu cầu. Lịch mới sẽ ở trạng thái chờ duyệt.
        </p>
      </div>

      <div className="mt-8 grid min-w-0 gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <BookingSteps activeStep={activeStep} />
        <section className="min-w-0 rounded-xl border bg-card p-5 sm:p-7">
          {formError ? (
            <div role="alert" className="mb-5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {formError}
            </div>
          ) : null}

          {activeStep === 0 ? (
            <ContextStep
              type={type}
              context={contextState.data}
              targetValue={resolvedTargetValue}
              hospitalValue={selection?.hospital.Uuid || ""}
              onTargetChange={chooseTarget}
              onHospitalChange={(value) =>
                updateUrl(
                  { hospital: value, date: null, time: null, step: "context" },
                  "replace",
                )
              }
              onNext={() => goToStep(1)}
              canContinue={Boolean(selection)}
            />
          ) : null}

          {activeStep === 1 && selection ? (
            <ScheduleStep
              date={date}
              time={time}
              availability={availability}
              availabilityState={availabilityState}
              availabilityKey={availabilityKey}
              onDateChange={(value) =>
                updateUrl({ date: value, time: null }, "replace")
              }
              onTimeChange={(value) =>
                updateUrl({ time: value }, "replace")
              }
              onRetry={() => setAvailabilityAttempt((current) => current + 1)}
              onBack={() => goToStep(0)}
              onNext={() => goToStep(2)}
            />
          ) : null}

          {activeStep === 2 && selection ? (
            <PatientStep
              patientName={patientName}
              gender={gender}
              medicalCode={medicalCode}
              note={note}
              onPatientNameChange={(value) => {
                setPatientName(value);
                if (requestedStep > 2) updateUrl({ step: "patient" }, "replace");
              }}
              onGenderChange={(value) => {
                setGender(value);
                if (requestedStep > 2) updateUrl({ step: "patient" }, "replace");
              }}
              onMedicalCodeChange={(value) => {
                setMedicalCode(value);
                if (requestedStep > 2) updateUrl({ step: "patient" }, "replace");
              }}
              onNoteChange={setNote}
              onFillFromAccount={() => {
                setPatientName(activeSession.PatientProfile.Name);
                setGender(activeSession.PatientProfile.Gender);
                setMedicalCode(activeSession.PatientProfile.MedicalCode);
                setFormError("");
                if (requestedStep > 2) updateUrl({ step: "patient" }, "replace");
              }}
              onBack={() => goToStep(1)}
              onNext={() => {
                const error = getPatientInfoError(
                  patientName,
                  gender,
                  medicalCode,
                );
                if (error) {
                  setFormError(error);
                  return;
                }
                if (note.trim().length > 500) {
                  setFormError("Ghi chú tối đa 500 ký tự.");
                  return;
                }
                goToStep(3);
              }}
            />
          ) : null}

          {activeStep === 3 && selection ? (
            <ReviewStep
              type={type}
              targetName={selection.targetName}
              hospitalName={selection.hospital.Name}
              appointmentAt={toAppointmentIso(date, time)}
              patientName={patientName.trim()}
              gender={gender}
              medicalCode={medicalCode.trim()}
              note={note}
              isSubmitting={isSubmitting}
              onBack={() => goToStep(2)}
              onSubmit={submitAppointment}
            />
          ) : null}
        </section>
      </div>
    </div>
  );
}

function BookingSteps({ activeStep }: { activeStep: number }) {
  return (
    <nav aria-label="Các bước đặt lịch" className="rounded-xl border bg-card p-4 lg:self-start">
      <ol className="grid grid-cols-4 gap-2 lg:grid-cols-1">
        {stepLabels.map((label, index) => (
          <li
            key={label}
            aria-current={index === activeStep ? "step" : undefined}
            className="flex min-w-0 flex-col items-center gap-2 text-center lg:flex-row lg:text-left"
          >
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${index <= activeStep ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              {index < activeStep ? <Check aria-hidden="true" /> : index + 1}
            </span>
            <span className={`hidden text-sm lg:block ${index === activeStep ? "font-semibold" : "text-muted-foreground"}`}>
              {label}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-center text-xs font-medium lg:hidden">
        {stepLabels[activeStep]}
      </p>
    </nav>
  );
}

type Selection = {
  targetUuid: string;
  targetName: string;
  hospital: BookingContext["Hospitals"][number];
};

function resolveSelection(
  type: BookingType,
  context: BookingContext,
  targetValue: string,
  hospitalValue: string,
): Selection | null {
  if (type === "hospital") {
    const hospital = context.Hospitals.find(
      (item) => item.Uuid === targetValue || item.Slug === targetValue,
    );
    return hospital
      ? { targetUuid: hospital.Uuid, targetName: hospital.Name, hospital }
      : null;
  }
  if (type === "doctor") {
    const doctor = context.Doctors.find(
      (item) => item.Uuid === targetValue || item.Slug === targetValue,
    );
    const hospital = context.Hospitals.find(
      (item) => item.Uuid === doctor?.HospitalUuid,
    );
    return doctor && hospital
      ? { targetUuid: doctor.Uuid, targetName: doctor.Name, hospital }
      : null;
  }

  const service = context.MedicalServices.find(
    (item) => item.Uuid === targetValue || item.Slug === targetValue,
  );
  const hospital = context.Hospitals.find(
    (item) => item.Uuid === hospitalValue,
  );
  const validPair = context.HospitalMedicalServices.some(
    (item) =>
      item.MedicalServiceUuid === service?.Uuid &&
      item.HospitalUuid === hospital?.Uuid,
  );
  return service && hospital && validPair
    ? { targetUuid: service.Uuid, targetName: service.Name, hospital }
    : null;
}

function resolveTargetUuid(
  type: BookingType,
  context: BookingContext,
  targetValue: string,
) {
  const targets =
    type === "hospital"
      ? context.Hospitals
      : type === "doctor"
        ? context.Doctors
        : context.MedicalServices;
  return (
    targets.find(
      (item) => item.Uuid === targetValue || item.Slug === targetValue,
    )?.Uuid || ""
  );
}

function ContextStep({
  type,
  context,
  targetValue,
  hospitalValue,
  onTargetChange,
  onHospitalChange,
  onNext,
  canContinue,
}: {
  type: BookingType;
  context: BookingContext;
  targetValue: string;
  hospitalValue: string;
  onTargetChange: (value: string) => void;
  onHospitalChange: (value: string) => void;
  onNext: () => void;
  canContinue: boolean;
}) {
  const targets =
    type === "hospital"
      ? context.Hospitals
      : type === "doctor"
        ? context.Doctors
        : context.MedicalServices;
  const selectedService =
    type === "medical-service"
      ? context.MedicalServices.find((item) => item.Uuid === targetValue)
      : null;
  const validHospitalUuids = new Set(
    context.HospitalMedicalServices
      .filter((item) => item.MedicalServiceUuid === selectedService?.Uuid)
      .map((item) => item.HospitalUuid),
  );

  return (
    <div>
      <h2 className="text-xl font-bold">Xác nhận đối tượng đặt lịch</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Chọn đúng đối tượng và cơ sở trước khi xem thời gian khả dụng.
      </p>
      <div className="mt-6 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="booking-target">{getTargetLabel(type)}</Label>
          <Select
            items={targets.map((item) => ({ value: item.Uuid, label: item.Name }))}
            value={targetValue || null}
            onValueChange={(value) => value && onTargetChange(value)}
          >
            <SelectTrigger id="booking-target" className="h-11 w-full">
              <SelectValue placeholder={`Chọn ${getTargetLabel(type).toLocaleLowerCase("vi-VN")}`} />
            </SelectTrigger>
            <SelectContent>
              {targets.map((item) => (
                <SelectItem key={item.Uuid} value={item.Uuid}>
                  {item.Name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {type === "doctor" && canContinue ? (
          <ReadOnlyField label="Cơ sở làm việc" value={context.Hospitals.find((item) => item.Uuid === hospitalValue)?.Name || "Đang cập nhật"} />
        ) : null}

        {type === "medical-service" && selectedService ? (
          <div className="space-y-2">
            <Label htmlFor="booking-hospital">Cơ sở thực hiện</Label>
            <Select
              items={context.Hospitals
                .filter((item) => validHospitalUuids.has(item.Uuid))
                .map((item) => ({ value: item.Uuid, label: item.Name }))}
              value={hospitalValue || null}
              onValueChange={(value) => value && onHospitalChange(value)}
            >
              <SelectTrigger id="booking-hospital" className="h-11 w-full">
                <SelectValue placeholder="Chọn cơ sở thực hiện" />
              </SelectTrigger>
              <SelectContent>
                {context.Hospitals
                  .filter((item) => validHospitalUuids.has(item.Uuid))
                  .map((item) => (
                    <SelectItem key={item.Uuid} value={item.Uuid}>
                      {item.Name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>
      <div className="mt-8 flex justify-end">
        <Button type="button" size="lg" disabled={!canContinue} onClick={onNext}>
          Chọn ngày và giờ
        </Button>
      </div>
    </div>
  );
}

function ScheduleStep({
  date,
  time,
  availability,
  availabilityState,
  availabilityKey,
  onDateChange,
  onTimeChange,
  onRetry,
  onBack,
  onNext,
}: {
  date: string;
  time: string;
  availability: Availability | null;
  availabilityState: AvailabilityState;
  availabilityKey: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  onRetry: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const minDate = getVietnamToday();
  const maxDate = addDays(minDate, 14);
  const isLoading = Boolean(date) &&
    (availabilityState.status === "idle" || availabilityState.key !== availabilityKey);

  return (
    <div>
      <h2 className="text-xl font-bold">Chọn ngày và giờ khả dụng</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Thời gian chỉ là khả dụng tại thời điểm tra cứu và sẽ được kiểm tra lại khi gửi.
      </p>
      <div className="mt-6 space-y-6">
        <div className="max-w-sm space-y-2">
          <Label htmlFor="appointment-date">Ngày khám</Label>
          <Input
            id="appointment-date"
            type="date"
            min={minDate}
            max={maxDate}
            value={date}
            onChange={(event) => onDateChange(event.target.value)}
            className="h-11"
          />
        </div>

        {isLoading ? <LoadingState label="Đang tải thời gian khả dụng" /> : null}
        {availabilityState.status === "error" && availabilityState.key === availabilityKey ? (
          <ErrorState message={availabilityState.message} onRetry={onRetry} />
        ) : null}
        {availability ? (
          <div>
            <p className="text-sm font-medium">
              Giờ phục vụ: {availability.WorkingHour}
            </p>
            {availability.Slots.some((slot) => slot.IsAvailable) ? (
              <div
                role="radiogroup"
                aria-label="Chọn giờ khám"
                className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5"
              >
                {availability.Slots.map((slot) => (
                  <Button
                    key={slot.AppointmentAt}
                    type="button"
                    variant={time === slot.Time ? "default" : "outline"}
                    disabled={!slot.IsAvailable}
                    role="radio"
                    aria-checked={time === slot.Time}
                    onClick={() => onTimeChange(slot.Time)}
                  >
                    {slot.Time}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="mt-3">
                <EmptyState message="Ngày này chưa có thời gian khả dụng. Vui lòng chọn ngày khác." />
              </div>
            )}
          </div>
        ) : null}
      </div>
      <StepActions
        onBack={onBack}
        onNext={onNext}
        nextDisabled={
          !date ||
          !time ||
          !availability?.Slots.some(
            (slot) => slot.Time === time && slot.IsAvailable,
          )
        }
      />
    </div>
  );
}

function PatientStep({
  patientName,
  gender,
  medicalCode,
  note,
  onPatientNameChange,
  onGenderChange,
  onMedicalCodeChange,
  onNoteChange,
  onFillFromAccount,
  onBack,
  onNext,
}: {
  patientName: string;
  gender: Gender | "";
  medicalCode: string;
  note: string;
  onPatientNameChange: (value: string) => void;
  onGenderChange: (value: Gender | "") => void;
  onMedicalCodeChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onFillFromAccount: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
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
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="appointment-patient-name">Họ và tên người khám</Label>
          <Input
            id="appointment-patient-name"
            value={patientName}
            maxLength={100}
            autoComplete="name"
            placeholder="Nhập họ và tên"
            onChange={(event) => onPatientNameChange(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="appointment-patient-gender">Giới tính</Label>
          <Select
            items={genderOptions}
            value={gender || null}
            onValueChange={(value) => onGenderChange((value as Gender) || "")}
          >
            <SelectTrigger id="appointment-patient-gender" className="w-full">
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
          <Label htmlFor="appointment-medical-code">Mã y tế</Label>
          <Input
            id="appointment-medical-code"
            value={medicalCode}
            maxLength={50}
            placeholder="Nhập mã y tế"
            onChange={(event) => onMedicalCodeChange(event.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="appointment-note">Ghi chú cho cơ sở</Label>
          <Textarea
            id="appointment-note"
            maxLength={500}
            value={note}
            placeholder="Mô tả ngắn nhu cầu khám nếu cần"
            onChange={(event) => onNoteChange(event.target.value)}
          />
          <p className="text-right text-xs text-muted-foreground">{note.length}/500</p>
        </div>
      </div>
      <StepActions
        onBack={onBack}
        onNext={onNext}
        nextDisabled={Boolean(getPatientInfoError(patientName, gender, medicalCode))}
      />
    </div>
  );
}

function ReviewStep({
  type,
  targetName,
  hospitalName,
  appointmentAt,
  patientName,
  gender,
  medicalCode,
  note,
  isSubmitting,
  onBack,
  onSubmit,
}: {
  type: BookingType;
  targetName: string;
  hospitalName: string;
  appointmentAt: string;
  patientName: string;
  gender: Gender | "";
  medicalCode: string;
  note: string;
  isSubmitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold">Kiểm tra yêu cầu đặt lịch</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Hãy kiểm tra thông tin trước khi gửi. Đây chưa phải lịch đã được duyệt.
      </p>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <ReviewField label="Loại lịch" value={getBookingTitle(type)} />
        <ReviewField label={getTargetLabel(type)} value={targetName} />
        <ReviewField label="Cơ sở" value={hospitalName} />
        <ReviewField label="Thời gian" value={formatAppointmentDateTime(appointmentAt)} />
        <ReviewField label="Người khám" value={`${patientName} · ${getGenderLabel(gender)}`} />
        <ReviewField label="Mã y tế" value={medicalCode} />
        <div className="sm:col-span-2">
          <ReviewField label="Ghi chú" value={note || "Không có"} />
        </div>
      </dl>
      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" size="lg" disabled={isSubmitting} onClick={onBack}>
          Quay lại
        </Button>
        <Button type="button" size="lg" disabled={isSubmitting} onClick={onSubmit}>
          {isSubmitting ? (
            <>
              <LoaderCircle aria-hidden="true" className="animate-spin" />
              Đang gửi yêu cầu...
            </>
          ) : (
            "Gửi yêu cầu đặt lịch"
          )}
        </Button>
      </div>
    </div>
  );
}

function StepActions({
  onBack,
  onNext,
  nextDisabled = false,
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
}) {
  return (
    <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
      <Button type="button" variant="outline" size="lg" onClick={onBack}>
        Quay lại
      </Button>
      <Button type="button" size="lg" disabled={nextDisabled} onClick={onNext}>
        Tiếp tục
      </Button>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/40 px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l-2 border-primary/30 pl-3">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold leading-6">{value}</dd>
    </div>
  );
}

function getTargetParam(type: BookingType) {
  if (type === "hospital") return "hospital";
  if (type === "doctor") return "doctor";
  return "service";
}

function getTargetLabel(type: BookingType) {
  if (type === "hospital") return "Cơ sở y tế";
  if (type === "doctor") return "Bác sĩ";
  return "Dịch vụ y tế";
}

function getBookingTitle(type: BookingType) {
  if (type === "hospital") return "Đặt lịch tại cơ sở";
  if (type === "doctor") return "Đặt lịch với bác sĩ";
  return "Đặt lịch dịch vụ y tế";
}

function getGenderLabel(gender: Gender | "") {
  if (gender === Gender.Female) return "Nữ";
  if (gender === Gender.Male) return "Nam";
  if (gender === Gender.Other) return "Khác";
  return "Chưa chọn";
}

function getPatientInfoError(
  patientName: string,
  gender: Gender | "",
  medicalCode: string,
) {
  if (!patientName.trim() || !gender || !medicalCode.trim()) {
    return "Vui lòng điền đầy đủ thông tin người khám.";
  }
  if (patientName.trim().length > 100) {
    return "Họ và tên tối đa 100 ký tự.";
  }
  if (medicalCode.trim().length > 50) {
    return "Mã y tế tối đa 50 ký tự.";
  }
  return "";
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00+07:00`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
