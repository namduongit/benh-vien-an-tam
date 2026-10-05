"use client";

import { DoctorWorkingScreen } from "@/components/internal/trang-tong/working-hours-screens";
import { DoctorDashboard } from "@/components/internal/trang-tong/clinical/doctor-dashboard-screen";
import { DoctorScheduleScreen } from "@/components/internal/trang-tong/clinical/doctor-schedule-screen";
import { AssignedCasesScreen } from "@/components/internal/trang-tong/clinical/assigned-cases-screen";
import { DoctorPrescriptionsScreen } from "@/components/internal/trang-tong/clinical/doctor-prescriptions-screen";
import { AvailableMedicineScreen } from "@/components/internal/trang-tong/clinical/available-medicine-screen";
import DoctorProfileScreen from "@/components/internal/trang-tong/clinical/doctor-profile-screen";

export function ClinicalScreens({ slug }: { slug: string }) {
    switch (slug) {
        case "tong-quan":
            return <DoctorDashboard />;
        case "lich-kham":
            return <DoctorScheduleScreen />;
        case "ca-kham":
            return <AssignedCasesScreen />;
        case "don-thuoc":
            return <DoctorPrescriptionsScreen />;
        case "thuoc-kha-dung":
            return <AvailableMedicineScreen />;
        case "ho-so-nghe-nghiep":
            return <DoctorProfileScreen />;
        case "gio-lam-viec-bac-si":
            return <DoctorWorkingScreen />;
        default:
            return null;
    }
}
