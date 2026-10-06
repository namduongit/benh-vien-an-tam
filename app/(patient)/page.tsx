import type { Metadata } from "next";

import { PatientHomePage } from "@/components/patient/patient-home-page";

export const metadata: Metadata = {
  title: "Trang chủ Patient",
  description: "Trang chủ dành cho bệnh nhân: đặt lịch, theo dõi lịch hẹn và khám phụ nhanh cơ sở, bác sĩ, dịch vụ.",
};

export default function PatientHome() {
  return <PatientHomePage />;
}