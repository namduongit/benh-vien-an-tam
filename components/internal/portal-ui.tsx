import { ArrowDownRight, ArrowUpRight, Search } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function PortalPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold text-primary">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#173b57] sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function MetricGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

export function MetricCard({
  label,
  value,
  detail,
  trend,
  icon,
  tone = "blue",
}: {
  label: string;
  value: string;
  detail: string;
  trend?: "up" | "down";
  icon: ReactNode;
  tone?: "blue" | "cyan" | "amber" | "green" | "red";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    cyan: "bg-cyan-50 text-cyan-700",
    amber: "bg-amber-50 text-amber-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <article className="border bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#173b57]">{value}</p>
        </div>
        <span className={cn("flex size-10 items-center justify-center rounded-md", tones[tone])}>{icon}</span>
      </div>
      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        {trend === "up" ? <ArrowUpRight className="size-3.5 text-emerald-600" /> : null}
        {trend === "down" ? <ArrowDownRight className="size-3.5 text-red-600" /> : null}
        {detail}
      </p>
    </article>
  );
}

export function PortalSection({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border bg-white", className)}>
      <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-[#173b57]">{title}</h2>
          {description ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function PortalToolbar({
  placeholder = "Tìm kiếm...",
  filters = [],
  action,
}: {
  placeholder?: string;
  filters?: { label: string; options: string[] }[];
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b bg-[#fbfdfe] p-4 lg:flex-row lg:items-center">
      <label className="relative min-w-0 flex-1 lg:max-w-sm">
        <span className="sr-only">{placeholder}</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder={placeholder} className="h-9 pl-9" />
      </label>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <label key={filter.label}>
            <span className="sr-only">{filter.label}</span>
            <select className="h-9 rounded-md border bg-white px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15">
              <option>{filter.label}</option>
              {filter.options.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
        ))}
      </div>
      {action ? <div className="lg:ml-auto">{action}</div> : null}
    </div>
  );
}

export function PortalTable({
  columns,
  rows,
  caption,
}: {
  columns: string[];
  rows: ReactNode[][];
  caption: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b bg-[#f6f9fb] text-xs uppercase tracking-wide text-muted-foreground">
            {columns.map((column) => <th key={column} scope="col" className="px-5 py-3 font-semibold">{column}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="transition-colors hover:bg-[#f8fbfc]">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="whitespace-nowrap px-5 py-4 align-middle text-foreground first:font-medium">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "green" | "amber" | "red" | "blue" | "neutral" | "purple";
}) {
  const tones = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    purple: "border-violet-200 bg-violet-50 text-violet-700",
    neutral: "border-slate-200 bg-slate-50 text-slate-600",
  };

  return <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", tones[tone])}>{children}</span>;
}

export function ProgressList({
  items,
}: {
  items: { label: string; value: number; display: string; color?: string }[];
}) {
  return (
    <div className="space-y-5 p-5">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-2 flex items-center justify-between gap-4 text-sm">
            <span className="font-medium">{item.label}</span>
            <span className="text-muted-foreground">{item.display}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className={cn("h-full rounded-full", item.color ?? "bg-primary")} style={{ width: `${Math.min(item.value, 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DetailGrid({ children }: { children: ReactNode }) {
  return <dl className="grid gap-x-8 gap-y-5 p-5 sm:grid-cols-2">{children}</dl>;
}

export function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1.5 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function PortalAction({ children, onClick, variant = "outline" }: { children: ReactNode; onClick?: () => void; variant?: "default" | "outline" | "ghost" }) {
  return <Button type="button" size="sm" variant={variant} onClick={onClick}>
    {children}
  </Button>;
}
