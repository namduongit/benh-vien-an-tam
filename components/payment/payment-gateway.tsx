"use client";

import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Clock3,
  LoaderCircle,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  PaymentServiceError,
  paymentService,
} from "@/lib/services/payment/PaymentService";
import type { PaymentEndpointQuery, ResultEndpoint } from "@/types/payment";

type PaymentState =
  | { status: "checking" }
  | { status: "ready"; payment: ResultEndpoint }
  | { status: "error"; message: string };

const requiredQueryKeys: Array<keyof PaymentEndpointQuery> = [
  "orderId",
  "amount",
  "orderInfo",
  "type",
  "expiresAt",
  "signature",
];

export function PaymentGateway({ query }: { query: PaymentEndpointQuery }) {
  const hasMissingParam = requiredQueryKeys.some((key) => !query[key]);
  const [state, setState] = useState<PaymentState>(() =>
    hasMissingParam
      ? {
          status: "error",
          message: "Đường dẫn thanh toán không đầy đủ hoặc không hợp lệ.",
        }
      : { status: "checking" },
  );

  useEffect(() => {
    const controller = new AbortController();

    if (hasMissingParam) {
      return () => controller.abort();
    }

    paymentService
      .checkEndpoint(query, controller.signal)
      .then((payment) => setState({ status: "ready", payment }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          status: "error",
          message:
            error instanceof PaymentServiceError
              ? error.message
              : "Không thể kiểm tra thông tin thanh toán.",
        });
      });

    return () => controller.abort();
  }, [hasMissingParam, query]);

  return (
    <main
      id="noi-dung-chinh"
      className="container-shell flex min-h-dvh items-center py-10 sm:py-16"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-primary">
            Thanh toán trực tuyến
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Hoàn tất thanh toán
          </h1>
          <p className="mt-3 leading-7 text-muted-foreground">
            Kiểm tra thông tin giao dịch và quét mã QR bằng ứng dụng ngân hàng
            để hoàn tất thanh toán.
          </p>
        </div>

        <div className="mt-8">
          {state.status === "checking" ? <CheckingState /> : null}
          {state.status === "error" ? (
            <ErrorState message={state.message} />
          ) : null}
          {state.status === "ready" ? (
            <PaymentContent payment={state.payment} />
          ) : null}
        </div>
      </div>
    </main>
  );
}

function CheckingState() {
  return (
    <section
      aria-live="polite"
      className="flex min-h-64 flex-col items-center justify-center rounded-xl border bg-card px-6 text-center"
    >
      <LoaderCircle aria-hidden="true" className="mb-5 size-10 animate-spin text-primary" />
      <h2 className="text-xl font-semibold">Đang kiểm tra giao dịch</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        Vui lòng chờ trong giây lát. Thông tin thanh toán chỉ hiển thị sau khi
        được xác thực.
      </p>
    </section>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <section
      role="alert"
      className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-destructive/30 bg-card px-6 text-center"
    >
      <span className="mb-5 grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle aria-hidden="true" className="size-7" />
      </span>
      <h2 className="text-xl font-semibold">Không thể tiếp tục thanh toán</h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        {message}
      </p>
      <Button className="mt-7" render={<Link href="/" />}>
        <ArrowLeft aria-hidden="true" />
        Về trang chủ
      </Button>
    </section>
  );
}

function PaymentContent({ payment }: { payment: ResultEndpoint }) {
  const expiresAt = useMemo(
    () => new Date(payment.expiresAt).getTime(),
    [payment.expiresAt],
  );
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    secondsUntil(expiresAt),
  );

  useEffect(() => {
    const updateCountdown = () => setRemainingSeconds(secondsUntil(expiresAt));
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  if (!Number.isFinite(expiresAt) || remainingSeconds <= 0) {
    return (
      <ErrorState message="Phiên giao dịch đã hết hạn, vui lòng tạo giao dịch mới." />
    );
  }

  return (
    <section aria-labelledby="payment-title">
      <div className="grid overflow-hidden rounded-xl border bg-card shadow-sm md:grid-cols-[minmax(17rem,0.85fr)_minmax(25rem,1.5fr)] lg:grid-cols-[minmax(20rem,0.85fr)_minmax(30rem,1.5fr)]">
        <aside className="border-b bg-muted/35 p-6 sm:p-8 md:border-b-0 md:border-r lg:p-10">
          <div className="mb-7 flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md bg-sky-100 text-primary">
              <ReceiptText aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Thông tin giao dịch
              </p>
              <h2 id="payment-title" className="mt-0.5 font-semibold">
                {paymentTypeLabel(payment.type)}
              </h2>
            </div>
          </div>

          <Countdown seconds={remainingSeconds} />

          <dl className="mt-6 space-y-5 text-sm">
            <InfoRow
              label="Mã đơn hàng"
              value={shortOrderId(payment.orderUuid)}
              mono
            />
            <InfoRow label="Nội dung" value={payment.content} mono />
            <div className="border-t pt-5">
              <dt className="text-xs text-muted-foreground">
                Số tiền thanh toán
              </dt>
              <dd className="mt-1 text-2xl font-bold text-primary">
                {formatCurrency(payment.amount)}
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex items-start gap-2 border-t pt-5 text-xs leading-5 text-muted-foreground">
            <LockKeyhole
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-emerald-600"
            />
            Giao dịch được xác thực và bảo mật bởi hệ thống An Tâm.
          </div>
        </aside>

        <div className="flex flex-col items-center px-5 py-7 text-center sm:px-10 sm:py-8 lg:px-12 lg:py-10">
          <h2 className="text-lg font-semibold">Quét mã QR để thanh toán</h2>
          <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
            Mở ứng dụng ngân hàng hoặc ví điện tử hỗ trợ VietQR
          </p>

          <div className="relative my-5 bg-white p-2 ring-1 ring-border shadow-sm">
            <span className="absolute -left-1.5 -top-1.5 size-6 border-l-2 border-t-2 border-primary" />
            <span className="absolute -right-1.5 -top-1.5 size-6 border-r-2 border-t-2 border-primary" />
            <span className="absolute -bottom-1.5 -left-1.5 size-6 border-b-2 border-l-2 border-primary" />
            <span className="absolute -bottom-1.5 -right-1.5 size-6 border-b-2 border-r-2 border-primary" />
            <Image
              src={payment.payUrl}
              alt={`Mã QR thanh toán ${formatCurrency(payment.amount)}`}
              width={360}
              height={360}
              priority
              className="size-[260px] object-contain sm:size-[320px] lg:size-[360px]"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Building2 aria-hidden="true" className="size-4 text-primary" />
            VietinBank · 109881092754 · NGUYEN NAM DUONG
          </div>

          <div className="mt-5 flex items-center gap-2 text-xs font-medium text-emerald-700">
            <ShieldCheck aria-hidden="true" className="size-4" />
            Kiểm tra đúng số tiền và nội dung trước khi xác nhận
          </div>
        </div>
      </div>
    </section>
  );
}

function Countdown({ seconds }: { seconds: number }) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  return (
    <div
      role="timer"
      aria-live="polite"
      className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
    >
      <Clock3 aria-hidden="true" className="size-4" />
      <span>Giao dịch hết hạn sau</span>
      <strong className="min-w-12 font-mono tabular-nums">
        {String(minutes).padStart(2, "0")}:{String(remaining).padStart(2, "0")}
      </strong>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={`mt-1 break-all font-semibold ${mono ? "font-mono text-[13px]" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function secondsUntil(timestamp: number) {
  if (!Number.isFinite(timestamp)) return 0;
  return Math.max(0, Math.ceil((timestamp - Date.now()) / 1000));
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function shortOrderId(orderId: string) {
  return orderId.length > 20
    ? `${orderId.slice(0, 8)}…${orderId.slice(-8)}`
    : orderId;
}

function paymentTypeLabel(type: string) {
  if (type.toLowerCase() === "appointment") return "Thanh toán lịch khám";
  if (type.toLowerCase() === "prescription") return "Thanh toán đơn thuốc";
  return "Thanh toán đơn hàng";
}
