"use client";

import { DoctorWorkingScreen } from "@/components/internal/trang-tong/working-hours-screens";
import { DoctorScheduleScreen } from "@/components/internal/trang-tong/clinical/doctor-schedule-screen";
import { DoctorPrescriptionsScreen } from "@/components/internal/trang-tong/clinical/doctor-prescriptions-screen";
import { AvailableMedicineScreen } from "@/components/internal/trang-tong/clinical/available-medicine-screen";
import DoctorProfileScreen from "@/components/internal/trang-tong/clinical/doctor-profile-screen";


import { DetailGrid, DetailItem, MetricCard, MetricGrid, PortalAction, PortalPageHeader, PortalSection, PortalTable, PortalToolbar, ProgressList, StatusPill } from "../portal-ui";
import { Activity, CalendarCheck2, CheckCircle2, Clock3, FilePlus2, Pill, Save } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@base-ui/react";

export function ClinicalScreens({ slug }: { slug: string }) {
  switch (slug) {
    case "tong-quan": return <DoctorDashboard />;
    case "lich-kham": return <DoctorScheduleScreen />;
    case "ca-kham": return <AssignedCasesScreen />;
    case "don-thuoc": return <DoctorPrescriptionsScreen />;
    case "thuoc-kha-dung": return <AvailableMedicineScreen />;
    case "ho-so-nghe-nghiep": return <DoctorProfileScreen />;
    case "gio-lam-viec-bac-si": return <DoctorWorkingScreen />;
    default: return null;
  }
}

const scheduleRows = [
  ["08:00", "Nguyễn Văn Hải · BN-10231", "Tái khám tim mạch", "P.203", <StatusPill key="1" tone="green">Hoàn thành</StatusPill>],
  ["08:45", "Lê Thị Thanh · BN-09128", "Khám theo bác sĩ", "P.203", <StatusPill key="2" tone="green">Hoàn thành</StatusPill>],
  ["09:30", "Nguyễn Thị Lan · BN-10248", "Khám theo bác sĩ", "P.203", <StatusPill key="3" tone="blue">Đã check-in</StatusPill>],
  ["10:15", "Phạm Minh Đức · BN-08245", "Tái khám", "P.203", <StatusPill key="4" tone="amber">Chưa đến</StatusPill>],
  ["11:00", "Trần Thu Hương · BN-11408", "Khám theo bác sĩ", "P.203", <StatusPill key="5" tone="blue">Đã xác nhận</StatusPill>],
];

function DoctorDashboard() {
  return (
    <div className="space-y-6">
      <PortalPageHeader eyebrow="Thứ Tư, 23 tháng 09" title="Chào buổi sáng, BS. Nguyễn Hoàng Minh" description="Bạn có 12 ca khám được phân công hôm nay tại phòng 203, Khoa Tim mạch." actions={<PortalAction variant="default">Bắt đầu ca tiếp theo</PortalAction>} />
      <MetricGrid>
        <MetricCard label="Ca hôm nay" value="12" detail="5 ca còn lại" icon={<CalendarCheck2 className="size-5" />} />
        <MetricCard label="Đã hoàn thành" value="7" detail="58% lịch trong ngày" trend="up" icon={<CheckCircle2 className="size-5" />} tone="green" />
        <MetricCard label="Đang chờ" value="2" detail="Ca tiếp theo lúc 09:30" icon={<Clock3 className="size-5" />} tone="amber" />
        <MetricCard label="Đơn đã kê" value="6" detail="1 đơn chưa thanh toán" icon={<Pill className="size-5" />} tone="cyan" />
      </MetricGrid>
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <PortalSection title="Lịch khám tiếp theo" action={<PortalAction>Xem toàn bộ lịch</PortalAction>}>
          <PortalTable caption="Lịch khám tiếp theo" columns={["Giờ", "Bệnh nhân", "Loại", "Phòng", "Trạng thái"]} rows={scheduleRows.slice(2)} />
        </PortalSection>
        <PortalSection title="Tiến độ hôm nay">
          <ProgressList items={[
            { label: "Hoàn thành", value: 58, display: "7/12", color: "bg-emerald-500" },
            { label: "Đã check-in", value: 17, display: "2/12" },
            { label: "Chưa đến", value: 25, display: "3/12", color: "bg-amber-500" },
          ]} />
          <div className="border-t p-5 text-sm"><p className="font-semibold">Ca gần nhất</p><p className="mt-2 text-muted-foreground">09:30 · Nguyễn Thị Lan · P.203</p></div>
        </PortalSection>
      </div>
    </div>
  );
}

function Field({ label, defaultValue, type = "text" }: { label: string; defaultValue: string; type?: string }) {
  const id = `doctor-${label.toLowerCase().replaceAll(" ", "-")}`;
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} type={type} defaultValue={defaultValue} /></div>;
}
