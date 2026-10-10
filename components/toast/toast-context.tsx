"use client";

import { CircleCheck, CircleX, Info, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastVariant = "success" | "error" | "info";

type ToastOptions = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastItem = ToastOptions & {
  id: number;
  variant: ToastVariant;
};

type ToastContextValue = {
  toast: (options: ToastOptions) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    ({ variant = "info", duration = 4_000, ...options }: ToastOptions) => {
      const id = ++nextId.current;
      setToasts((current) => [...current, { ...options, id, variant }]);
      window.setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  const success = useCallback(
    (title: string, description?: string) =>
      toast({ title, description, variant: "success" }),
    [toast],
  );
  const error = useCallback(
    (title: string, description?: string) =>
      toast({ title, description, variant: "error" }),
    [toast],
  );

  return (
    <ToastContext.Provider value={{ toast, success, error }}>
      {children}
      <div
        className="pointer-events-none fixed top-4 right-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((item) => {
          const Icon =
            item.variant === "success"
              ? CircleCheck
              : item.variant === "error"
                ? CircleX
                : Info;
          return (
            <div
              key={item.id}
              role={item.variant === "error" ? "alert" : "status"}
              className="pointer-events-auto flex gap-3 rounded-lg border bg-white p-4 shadow-lg"
            >
              <Icon
                aria-hidden="true"
                className={
                  item.variant === "success"
                    ? "mt-0.5 size-5 shrink-0 text-emerald-600"
                    : item.variant === "error"
                      ? "mt-0.5 size-5 shrink-0 text-destructive"
                      : "mt-0.5 size-5 shrink-0 text-primary"
                }
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{item.title}</p>
                {item.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                aria-label="Đóng thông báo"
                className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => dismiss(item.id)}
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast phải được sử dụng bên trong ToastProvider.");
  }
  return context;
}
