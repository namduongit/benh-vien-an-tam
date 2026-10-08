"use client";

import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useAuth } from "@/components/auth/auth-provider";
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
import {
  normalizePhone,
  validateRegistration,
  type AuthFieldErrors,
} from "@/lib/auth/validation";
import { genderOptions } from "@/lib/auth/options";
import { AuthServiceError } from "@/lib/services/auth/AuthService";
import type { RegisterPatientRequest } from "@/types/auth";
import { Gender } from "@/types/models";

export function RegisterForm({ returnUrl }: { returnUrl: string }) {
  const { register } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [birthdate, setBirthdate] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const request: RegisterPatientRequest = {
      Name: name,
      Gender: gender as Gender,
      Birthdate: birthdate,
      Email: email,
      Phone: normalizePhone(phone),
      Password: password,
      ConfirmPassword: confirmPassword,
    };
    const nextErrors = validateRegistration(request);

    setErrors(nextErrors);
    setServerError("");
    if (Object.keys(nextErrors).length) {
      return;
    }

    setIsSubmitting(true);
    try {
      await register(request);
      const query = new URLSearchParams({ registered: "1", returnUrl });
      router.replace(`/dang-nhap?${query.toString()}`);
    } catch (error) {
      if (error instanceof AuthServiceError) {
        setServerError(error.message);
        setErrors(error.fieldErrors);
      } else {
        setServerError("Đã xảy ra lỗi. Vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const loginHref = `/dang-nhap?returnUrl=${encodeURIComponent(returnUrl)}`;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {serverError ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {serverError}
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Họ và tên</Label>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            value={name}
            aria-invalid={Boolean(errors.Name)}
            aria-describedby={errors.Name ? "name-error" : undefined}
            disabled={isSubmitting}
            onChange={(event) => setName(event.target.value)}
            className="h-10"
          />
          {errors.Name ? (
            <p id="name-error" className="text-sm text-destructive">{errors.Name}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Giới tính</Label>
          <Select
            items={genderOptions}
            value={gender || null}
            onValueChange={(value) => setGender(value as Gender)}
            disabled={isSubmitting}
          >
            <SelectTrigger
              id="gender"
              className="h-10 w-full"
              aria-invalid={Boolean(errors.Gender)}
              aria-describedby={errors.Gender ? "gender-error" : undefined}
            >
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
          {errors.Gender ? (
            <p id="gender-error" className="text-sm text-destructive">{errors.Gender}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthdate">Ngày sinh</Label>
          <Input
            id="birthdate"
            name="birthdate"
            type="date"
            autoComplete="bday"
            value={birthdate}
            aria-invalid={Boolean(errors.Birthdate)}
            aria-describedby={errors.Birthdate ? "birthdate-error" : undefined}
            disabled={isSubmitting}
            onChange={(event) => setBirthdate(event.target.value)}
            className="h-10"
          />
          {errors.Birthdate ? (
            <p id="birthdate-error" className="text-sm text-destructive">{errors.Birthdate}</p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            aria-invalid={Boolean(errors.Email)}
            aria-describedby={errors.Email ? "email-error" : undefined}
            disabled={isSubmitting}
            onChange={(event) => setEmail(event.target.value)}
            className="h-10"
          />
          {errors.Email ? (
            <p id="email-error" className="text-sm text-destructive">{errors.Email}</p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="register-phone">Số điện thoại</Label>
          <Input
            id="register-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="Ví dụ: 0901234567"
            value={phone}
            aria-invalid={Boolean(errors.Phone)}
            aria-describedby={errors.Phone ? "register-phone-error" : undefined}
            disabled={isSubmitting}
            onChange={(event) => setPhone(event.target.value)}
            className="h-10"
          />
          {errors.Phone ? (
            <p id="register-phone-error" className="text-sm text-destructive">{errors.Phone}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-password">Mật khẩu</Label>
          <div className="relative">
            <Input
              id="register-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              aria-invalid={Boolean(errors.Password)}
              aria-describedby={errors.Password ? "register-password-error" : undefined}
              disabled={isSubmitting}
              onChange={(event) => setPassword(event.target.value)}
              className="h-10 pr-11"
            />
            <button
              type="button"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              aria-pressed={showPassword}
              className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" className="size-4" />
              ) : (
                <Eye aria-hidden="true" className="size-4" />
              )}
            </button>
          </div>
          {errors.Password ? (
            <p id="register-password-error" className="text-sm text-destructive">{errors.Password}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Nhập lại mật khẩu</Label>
          <Input
            id="confirm-password"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={confirmPassword}
            aria-invalid={Boolean(errors.ConfirmPassword)}
            aria-describedby={errors.ConfirmPassword ? "confirm-password-error" : undefined}
            disabled={isSubmitting}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="h-10"
          />
          {errors.ConfirmPassword ? (
            <p id="confirm-password-error" className="text-sm text-destructive">{errors.ConfirmPassword}</p>
          ) : null}
        </div>
      </div>

      <p className="text-sm leading-6 text-muted-foreground">
        Tài khoản được tạo dành riêng cho người bệnh. Hệ thống không yêu cầu bạn
        chọn vai trò.
      </p>

      <Button type="submit" size="lg" className="h-11 w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <LoaderCircle aria-hidden="true" className="animate-spin" />
            Đang tạo tài khoản...
          </>
        ) : (
          "Tạo tài khoản"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Đã có tài khoản?{" "}
        <Link href={loginHref} className="font-semibold text-primary hover:underline">
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}
