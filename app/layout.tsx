import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";

import { AuthProvider } from "@/components/auth/auth-provider";
import { SiteChrome } from "@/components/layout/site-chrome";
import { ToastProvider } from "@/components/toast/toast-context";

import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "AnTam",
    template: "%s | AnTam",
  },
  description:
    "Nền tảng hỗ trợ người bệnh tìm kiếm cơ sở y tế, bác sĩ, dịch vụ và quản lý lịch khám.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col overflow-x-hidden">
        <ToastProvider>
          <AuthProvider>
            <SiteChrome>{children}</SiteChrome>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
