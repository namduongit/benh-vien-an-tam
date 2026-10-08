"use client";

import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/toast/toast-context";
import { normalizePhone, validateLogin, type AuthFieldErrors } from "@/lib/auth/validation";
import { AuthServiceError } from "@/lib/services/auth/AuthService";

type LoginFormProps = {
  returnUrl: string;
  registered: boolean;
};

export function LoginForm({ returnUrl, registered }: LoginFormProps) {
  const { login } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const credentials = {
      Phone: normalizePhone(phone),
      Password: password,
    };
    const nextErrors = validateLogin(credentials);

    setErrors(nextErrors);
    setServerError("");
    if (Object.keys(nextErrors).length) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login(credentials);
      toast.success("Đăng nhập thành công", "Chào mừng bạn quay lại An Tâm.");
      router.replace(returnUrl);
      router.refresh();
    } catch (error) {
      if (error instanceof AuthServiceError) {
        setServerError(error.message);
        setErrors(error.fieldErrors);
        toast.error("Đăng nhập thất bại", error.message);
      } else {
        setServerError("Đã xảy ra lỗi. Vui lòng thử lại.");
        toast.error("Đăng nhập thất bại", "Đã xảy ra lỗi. Vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const registerHref = `/dang-ky?returnUrl=${encodeURIComponent(returnUrl)}`;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {registered ? (
        <div
          role="status"
          className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground"
        >
          Đăng ký thành công. Bạn có thể đăng nhập bằng tài khoản vừa tạo.
        </div>
      ) : null}
      {serverError ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {serverError}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="phone">Số điện thoại</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="Ví dụ: 0901234567"
          value={phone}
          aria-invalid={Boolean(errors.Phone)}
          aria-describedby={errors.Phone ? "phone-error" : undefined}
          disabled={isSubmitting}
          onChange={(event) => setPhone(event.target.value)}
          className="h-10"
        />
        {errors.Phone ? (
          <p id="phone-error" className="text-sm text-destructive">
            {errors.Phone}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mật khẩu</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            aria-invalid={Boolean(errors.Password)}
            aria-describedby={errors.Password ? "password-error" : undefined}
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
          <p id="password-error" className="text-sm text-destructive">
            {errors.Password}
          </p>
        ) : null}
      </div>

      <Button type="submit" size="lg" className="h-11 w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <LoaderCircle aria-hidden="true" className="animate-spin" />
            Đang đăng nhập...
          </>
        ) : (
          "Đăng nhập"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{" "}
        <Link href={registerHref} className="font-semibold text-primary hover:underline">
          Đăng ký ngay
        </Link>
      </p>
    </form>
  );
}
