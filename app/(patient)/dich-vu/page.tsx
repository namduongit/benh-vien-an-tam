import type { Metadata } from "next";
import { Suspense } from "react";

import {
  PatientServiceDirectory,
  PatientServiceDirectorySkeleton,
} from "@/components/patient/patient-service-directory";

export const metadata: Metadata = {
  title: "Dịch vụ y tế | Patient",
  description: "Trang tra cứu dịch vụ y tế dành cho bệnh nhân đã đăng nhập.",
};

export default function PatientServicesPage() {
  return (
    <Suspense fallback={<PatientServiceDirectorySkeleton />}>
      <PatientServiceDirectory />
    </Suspense>
  );
}