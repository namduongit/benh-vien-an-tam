"use client";

import {
  Activity,
  AlertTriangle,
  Archive,
  BarChart3,
  BedDouble,
  BookOpenCheck,
  Building2,
  CalendarDays,
  CalendarClock,
  ClipboardList,
  Cross,
  FileText,
  History,
  Hospital,
  LayoutDashboard,
  LogOut,
  Menu,
  Pill,
  ReceiptText,
  Star,
  ShieldCheck,
  Stethoscope,
  Truck,
  UserRound,
  UsersRound,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type {
  PortalDefinition,
  PortalIconName,
  PortalNavigationItem,
} from "@/lib/combined-internal-portal";
import { cn } from "@/lib/utils";

const portalIcons: Record<PortalIconName, ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  hospital: Building2,
  department: Stethoscope,
  service: Activity,
  medicine: Pill,
  account: UsersRound,
  report: BarChart3,
  audit: BookOpenCheck,
  room: BedDouble,
  appointment: CalendarDays,
  prescription: FileText,
  review: Star,
  patient: UserRound,
  profile: ClipboardList,
  payment: WalletCards,
  inventory: Archive,
  alert: AlertTriangle,
  provider: Truck,
  ticket: ReceiptText,
  history: History,
  schedule: CalendarClock,
  permission: ShieldCheck,
};

type PortalShellProps = {
  portal: PortalDefinition;
  children: ReactNode;
  navigationGroups: PortalNavigationGroup[];
};

export type PortalNavigationGroup = {
  label?: string;
  items: Array<PortalNavigationItem & { href: string }>;
};

export function PortalShell({ portal, children, navigationGroups }: PortalShellProps) {
  return (
    <div className="min-h-screen bg-[#f3f7f9] text-[#173b57] lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="hidden h-screen flex-col border-r border-white/10 bg-[#123f5b] text-white lg:sticky lg:top-0 lg:flex">
        <PortalBrand />
        <PortalNavigation groups={navigationGroups} />
        <div className="mt-auto border-t border-white/10 p-4">
          <p className="text-xs text-white/55">Phạm vi truy cập</p>
          <p className="mt-1 text-sm font-medium text-white/90">{portal.scope}</p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <PortalMobileNavigation portal={portal} groups={navigationGroups} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#173b57]">{portal.name}</p>
              <p className="truncate text-xs text-muted-foreground">{portal.context}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">Nguyễn Minh Anh</p>
              <p className="text-xs text-muted-foreground">Tài khoản nội bộ</p>
            </div>
            <span className="flex size-9 items-center justify-center rounded-full bg-[#e1f3fa] text-sm font-bold text-primary">
              MA
            </span>
            <Link
              href="/noi-bo/dang-nhap"
              aria-label="Đăng xuất"
              className={buttonVariants({ variant: "ghost", size: "icon-lg" })}
            >
              <LogOut aria-hidden="true" />
            </Link>
          </div>
        </header>
        <main id="noi-dung-noi-bo" className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function PortalBrand() {
  return (
    <Link href="/noi-bo/dang-nhap" className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
      <span className="flex size-10 items-center justify-center rounded-md bg-[#ffc94a] text-[#173b57]">
        <Cross aria-hidden="true" className="size-5" strokeWidth={2.5} />
      </span>
      <span>
        <strong className="block text-lg tracking-tight">AnTam</strong>
        <span className="text-xs text-white/60">Hệ thống nội bộ</span>
      </span>
    </Link>
  );
}

function PortalNavigation({
  groups,
  mobile = false,
}: {
  groups: PortalNavigationGroup[];
  mobile?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Điều hướng cổng nội bộ" className="min-h-0 flex-1 space-y-5 overflow-y-auto p-3">
      {groups.map((group, groupIndex) => (
        <div key={group.label ?? groupIndex} className="space-y-1">
          {group.label ? (
            <p className={cn("px-3 pb-1 text-[0.6875rem] font-bold uppercase tracking-wider", mobile ? "text-muted-foreground" : "text-white/45")}>
              {group.label}
            </p>
          ) : null}
          {group.items.map((item) => {
            const Icon = portalIcons[item.icon];
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const link = (
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  mobile
                    ? active
                      ? "bg-secondary text-primary"
                      : "text-foreground hover:bg-muted"
                    : active
                      ? "bg-white text-[#123f5b]"
                      : "text-white/72 hover:bg-white/8 hover:text-white",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );

            return mobile ? <SheetClose key={item.href} render={link} /> : <div key={item.href}>{link}</div>;
          })}
        </div>
      ))}
    </nav>
  );
}

function PortalMobileNavigation({
  portal,
  groups,
}: {
  portal: PortalDefinition;
  groups: PortalNavigationGroup[];
}) {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" size="icon-lg" className="lg:hidden" />}>
        <Menu aria-hidden="true" />
        <span className="sr-only">Mở menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-[19rem] gap-0 p-0" showCloseButton={false}>
        <SheetHeader className="border-b p-5">
          <SheetTitle className="flex items-center gap-2 text-[#173b57]">
            <Hospital aria-hidden="true" className="size-5 text-primary" />
            {portal.name}
          </SheetTitle>
          <SheetDescription>{portal.scope}</SheetDescription>
        </SheetHeader>
        <PortalNavigation groups={groups} mobile />
      </SheetContent>
    </Sheet>
  );
}
