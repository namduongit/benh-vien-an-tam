import type { Metadata } from "next";
import { Suspense } from "react";

import {
  PatientDoctorDirectory,
  PatientDoctorDirectorySkeleton,
} from "@/components/patient/patient-doctor-directory";

export const metadata: Metadata = {
  title: "Bác sĩ | Patient",
  description: "Trang tra cứu bác sĩ dành cho bệnh nhân đã đăng nhập.",
};

export default function PatientDoctorsPage() {
  return (
    <Suspense fallback={<PatientDoctorDirectorySkeleton />}>
      <PatientDoctorDirectory />
    </Suspense>
  );
}