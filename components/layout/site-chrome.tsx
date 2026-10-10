"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/noi-bo") || pathname.startsWith("/gateway")) {
    return children;
  }

  return (
    <>
      <a
        href="#noi-dung-chinh"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Chuyển đến nội dung chính
      </a>
      <SiteHeader />
      <main id="noi-dung-chinh" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
