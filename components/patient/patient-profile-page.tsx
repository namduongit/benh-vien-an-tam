"use client";

import { LoaderCircle, UserRound } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { genderOptions } from "@/lib/auth/options";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
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
import { getVietnamToday } from "@/lib/booking/working-hours";
import type { AsyncState } from "@/lib/http/response";
import {
  type PatientProfileFieldErrors,
  validatePatientProfile,
} from "@/lib/patient/validation";
import {
  PatientServiceError,
  patientService,
} from "@/lib/services/patient/PatientService";
import { cn } from "@/lib/utils";
import { Gender } from "@/types/models";
import type {
  PatientProfileView,
  UpdatePatientProfileRequest,
} from "@/types/patient";

export function PatientProfilePage() {
  const { session, syncPatientProfile } = useAuth();
  const accountUuid = session?.Account.Uuid;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<AsyncState<PatientProfileView>>({
    status: "loading",
  });

  useEffect(() => {
    if (!accountUuid) return;
    const controller = new AbortController();
    let active = true;
    patientService
      .getCurrent(controller.signal)
      .then((response) => {
        if (active) setState({ status: "success", data: response.Data });
      })
      .catch(() => {
        if (active) {
          setState({
            status: "error",
            message: "Không thể tải hồ sơ người bệnh. Vui lòng thử lại.",
          });
        }
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [accountUuid, attempt]);

  if (!session) return null;

  return (
    <div className="min-w-0">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold text-primary">Khu vực Patient</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Hồ sơ của tôi
        </h1>
        <p className="mt-3 leading-7 text-muted-foreground">
          Kiểm tra và cập nhật thông tin cá nhân dùng trong các yêu cầu đặt lịch.
        </p>
      </div>

      {state.status === "loading" || state.status === "idle" ? (
        <div className="mt-8"><LoadingState label="Đang tải hồ sơ" /></div>
      ) : null}
      {state.status === "error" ? (
        <div className="mt-8">
          <ErrorState
            message={state.message}
            onRetry={() => {
              setState({ status: "loading" });
              setAttempt((value) => value + 1);
            }}
          />
        </div>
      ) : null}
      {state.status === "success" ? (
        <ProfileEditor
          view={state.data}
          onSaved={(view) => {
            setState({ status: "success", data: view });
            syncPatientProfile(view.Profile, session);
          }}
        />
      ) : null}
    </div>
  );
}

function ProfileEditor({
  view,
  onSaved,
}: {
  view: PatientProfileView;
  onSaved: (view: PatientProfileView) => void;
}) {
  const [avatar, setAvatar] = useState(view.Profile.Avatar);
  const [name, setName] = useState(view.Profile.Name);
  const [gender, setGender] = useState<Gender>(view.Profile.Gender);
  const [birthdate, setBirthdate] = useState(toDateInput(view.Profile.Birthdate));
  const [email, setEmail] = useState(view.Profile.Email);
  const [errors, setErrors] = useState<PatientProfileFieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [maximumBirthdate] = useState(() => {
    const today = new Date(`${getVietnamToday()}T00:00:00.000Z`);
    today.setUTCDate(today.getUTCDate() - 1);
    return today.toISOString().slice(0, 10);
  });
  const originalBirthdate = toDateInput(view.Profile.Birthdate);
  const isDirty =
    avatar !== view.Profile.Avatar ||
    name !== view.Profile.Name ||
    gender !== view.Profile.Gender ||
    birthdate !== originalBirthdate ||
    email !== view.Profile.Email;

  function resetForm() {
    setAvatar(view.Profile.Avatar);
    setName(view.Profile.Name);
    setGender(view.Profile.Gender);
    setBirthdate(originalBirthdate);
    setEmail(view.Profile.Email);
    setErrors({});
    setServerError("");
    setSuccessMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const request: UpdatePatientProfileRequest = {
      Avatar: avatar,
      Name: name,
      Gender: gender,
      Birthdate: new Date(`${birthdate}T00:00:00.000Z`),
      Email: email,
    };
    const nextErrors = validatePatientProfile(request);
    setErrors(nextErrors);
    setServerError("");
    setSuccessMessage("");
    if (Object.keys(nextErrors).length) return;

    setIsSubmitting(true);
    try {
      const response = await patientService.updateCurrent(request);
      onSaved(response.Data);
      setAvatar(response.Data.Profile.Avatar);
      setName(response.Data.Profile.Name);
      setGender(response.Data.Profile.Gender);
      setBirthdate(toDateInput(response.Data.Profile.Birthdate));
      setEmail(response.Data.Profile.Email);
      setSuccessMessage(response.Message);
    } catch (error) {
      if (error instanceof PatientServiceError) {
        setErrors(error.fieldErrors);
        setServerError(error.message);
      } else {
        setServerError("Không thể cập nhật hồ sơ. Vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-8 min-w-0 rounded-xl border bg-card p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <UserRound aria-hidden="true" className="size-5 text-primary" />
              <h2 className="text-xl font-bold">Thông tin cá nhân</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Mã y tế và số điện thoại không thể thay đổi tại đây.
            </p>
          </div>
          {isDirty ? <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">Có thay đổi chưa lưu</span> : null}
        </div>

        {serverError ? <p role="alert" className="mt-5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{serverError}</p> : null}
        {successMessage ? <p role="status" className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{successMessage}</p> : null}

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <ProfileField htmlFor="profile-avatar" label="URL ảnh đại diện" error={errors.Avatar} className="sm:col-span-2">
            <Input id="profile-avatar" type="url" inputMode="url" value={avatar} disabled={isSubmitting} aria-invalid={Boolean(errors.Avatar)} aria-describedby={errors.Avatar ? "profile-avatar-error" : undefined} placeholder="https://example.com/avatar.jpg" onChange={(event) => setAvatar(event.target.value)} />
          </ProfileField>
          <ProfileField htmlFor="profile-name" label="Họ và tên" error={errors.Name} className="sm:col-span-2">
            <Input id="profile-name" autoComplete="name" value={name} disabled={isSubmitting} aria-invalid={Boolean(errors.Name)} aria-describedby={errors.Name ? "profile-name-error" : undefined} onChange={(event) => setName(event.target.value)} />
          </ProfileField>
          <ProfileField htmlFor="profile-gender" label="Giới tính" error={errors.Gender}>
            <Select items={genderOptions} value={gender} disabled={isSubmitting} onValueChange={(value) => setGender(value as Gender)}>
              <SelectTrigger id="profile-gender" className="w-full" aria-invalid={Boolean(errors.Gender)} aria-describedby={errors.Gender ? "profile-gender-error" : undefined}><SelectValue /></SelectTrigger>
              <SelectContent>
                {genderOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </ProfileField>
          <ProfileField htmlFor="profile-birthdate" label="Ngày sinh" error={errors.Birthdate}>
            <Input id="profile-birthdate" type="date" autoComplete="bday" max={maximumBirthdate} value={birthdate} disabled={isSubmitting} aria-invalid={Boolean(errors.Birthdate)} aria-describedby={errors.Birthdate ? "profile-birthdate-error" : undefined} onChange={(event) => setBirthdate(event.target.value)} />
          </ProfileField>
          <ProfileField htmlFor="profile-email" label="Email" error={errors.Email} className="sm:col-span-2">
            <Input id="profile-email" type="email" autoComplete="email" value={email} disabled={isSubmitting} aria-invalid={Boolean(errors.Email)} aria-describedby={errors.Email ? "profile-email-error" : undefined} onChange={(event) => setEmail(event.target.value)} />
          </ProfileField>
          <ReadOnlyField id="profile-medical-code" label="Mã y tế" value={view.Profile.MedicalCode} />
          <ReadOnlyField id="profile-phone" label="Số điện thoại" value={view.Phone} />
        </div>

        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" size="lg" disabled={!isDirty || isSubmitting} onClick={resetForm}>Hủy thay đổi</Button>
          <Button type="submit" size="lg" disabled={!isDirty || isSubmitting}>
            {isSubmitting ? <><LoaderCircle aria-hidden="true" className="animate-spin" />Đang lưu...</> : "Lưu thay đổi"}
          </Button>
        </div>
    </form>
  );
}

function ProfileField({
  label,
  htmlFor,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("min-w-0 space-y-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p id={`${htmlFor}-error`} className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function ReadOnlyField({ id, label, value }: { id: string; label: string; value: string }) {
  return (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} readOnly aria-readonly="true" className="bg-muted/60 text-muted-foreground" />
    </div>
  );
}

function toDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}
