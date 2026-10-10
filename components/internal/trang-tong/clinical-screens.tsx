"use client";

import { DoctorWorkingScreen } from "@/components/internal/trang-tong/working-hours-screens";
import { DoctorScheduleScreen } from "@/components/internal/trang-tong/doctor-schedule-screen";
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

function AssignedCasesScreen() {
  return (
    <div className="space-y-6">
      <PortalPageHeader eyebrow="Ca đang xử lý · 09:30" title="Nguyễn Thị Lan" description="Mã y tế BN-10248 · Nữ · Lịch được phân công trực tiếp cho bạn." actions={
        <>
        <PortalAction>Hủy ca</PortalAction>
        <PortalAction variant="default"><CheckCircle2 />Hoàn thành ca</PortalAction>
        </>
      } />
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <PortalSection title="Thông tin lượt khám">
            <DetailGrid>
              <DetailItem label="Thời gian" value="09:30 · 23/09/2026" />
              <DetailItem label="Phòng" value="P.203" />
              <DetailItem label="Loại lịch" value="Khám theo bác sĩ" />
              <DetailItem label="Trạng thái" value={<StatusPill tone="blue">Đã check-in</StatusPill>} />
              <DetailItem label="Ghi chú đặt lịch" value="Đau ngực nhẹ khi vận động trong 3 ngày gần đây." />
              <DetailItem label="Mã lịch" value="APT-DOC-10248" />
            </DetailGrid>
          </PortalSection>
          <PortalSection title="Lịch liên quan gần đây">
            <div className="divide-y">
              {["12/06/2026 · Khám tim mạch · Hoàn thành", "08/02/2026 · Điện tim · Hoàn thành"].map((item) => <div key={item} className="flex items-center gap-3 px-5 py-4 text-sm"><Clock3 className="size-4 text-primary" /><span>{item}</span></div>)}
            </div>
          </PortalSection>
        </div>
        <PortalSection title="Kê đơn cho ca khám" description="Chỉ có thể chỉnh sửa khi đơn còn trạng thái chưa thanh toán.">
          <div className="space-y-5 p-5">
            <div className="grid gap-4 sm:grid-cols-[1fr_7rem_7rem]">
              <Field label="Thuốc" defaultValue="Paracetamol 500mg" />
              <Field label="Số lượng" defaultValue="10" type="number" />
              <Field label="Đơn vị" defaultValue="Viên" />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Mỗi lần" defaultValue="1" type="number" />
              <Field label="Lần / ngày" defaultValue="2" type="number" />
              <Field label="Số ngày" defaultValue="5" type="number" />
            </div>
            <div className="space-y-2"><Label htmlFor="doctor-medicine-note">Hướng dẫn sử dụng</Label><Input id="doctor-medicine-note" defaultValue="Uống sau ăn sáng và tối" /></div>
            <button className="flex w-full items-center justify-center gap-2 border border-dashed border-primary/40 bg-secondary/50 py-3 text-sm font-semibold text-primary hover:bg-secondary"><FilePlus2 className="size-4" />Thêm thuốc vào đơn</button>
            <div className="space-y-2"><Label htmlFor="prescription-note">Ghi chú đơn thuốc</Label><Textarea id="prescription-note" rows={4} placeholder="Lưu ý chung cho người bệnh" /></div>
            <div className="flex justify-end"><PortalAction variant="default"><Save />Lưu đơn thuốc</PortalAction></div>
          </div>
        </PortalSection>
      </div>
    </div>
  );
}

function DoctorPrescriptionsScreen() {
  return (
    <div className="space-y-6">
      <PortalPageHeader eyebrow="Đơn do tôi kê" title="Đơn thuốc" description="Quản lý đơn thuốc thuộc các ca được phân công; đơn đã thanh toán chỉ được xem." />
      <MetricGrid>
        <MetricCard label="Đơn tháng này" value="186" detail="Tăng 12 đơn so với tháng trước" trend="up" icon={<Pill className="size-5" />} />
        <MetricCard label="Chưa thanh toán" value="8" detail="Có thể chỉnh sửa hoặc hủy" icon={<Clock3 className="size-5" />} tone="amber" />
        <MetricCard label="Đã thanh toán" value="174" detail="Chỉ đọc" icon={<CheckCircle2 className="size-5" />} tone="green" />
        <MetricCard label="Đã hủy" value="4" detail="Đều có ghi nhận lý do" icon={<Activity className="size-5" />} tone="red" />
      </MetricGrid>
      <PortalSection title="Danh sách đơn thuốc">
        <PortalToolbar placeholder="Tìm mã đơn hoặc bệnh nhân" filters={[{ label: "Tháng này", options: ["Hôm nay", "7 ngày", "3 tháng"] }, { label: "Tất cả trạng thái", options: ["Chưa thanh toán", "Đã thanh toán", "Đã hủy"] }]} />
        <PortalTable caption="Đơn thuốc của bác sĩ" columns={["Mã đơn", "Bệnh nhân", "Ngày kê", "Số thuốc", "Tổng tiền", "Trạng thái"]} rows={[
          ["RX-260923-074", "Nguyễn Thị Lan", "23/09 09:52", "3", "486.000 đ", <StatusPill key="1" tone="amber">Chưa thanh toán</StatusPill>],
          ["RX-260923-069", "Lê Thị Thanh", "23/09 08:58", "2", "215.000 đ", <StatusPill key="2" tone="green">Đã thanh toán</StatusPill>],
          ["RX-260923-064", "Nguyễn Văn Hải", "23/09 08:24", "4", "624.000 đ", <StatusPill key="3" tone="green">Đã thanh toán</StatusPill>],
          ["RX-260922-182", "Trần Minh Đức", "22/09 16:42", "1", "0 đ", <StatusPill key="4" tone="red">Đã hủy</StatusPill>],
        ]} />
      </PortalSection>
    </div>
  );
}

function AvailableMedicineScreen() {
  return (
    <div className="space-y-6">
      <PortalPageHeader eyebrow="Tra cứu tại chi nhánh" title="Thuốc khả dụng" description="Thông tin số lượng chỉ hỗ trợ kê đơn; bác sĩ không có quyền điều chỉnh tồn kho." />
      <PortalSection title="Danh mục khả dụng" description="Tồn kho cập nhật lúc 09:45">
        <PortalToolbar placeholder="Tìm tên thuốc" filters={[{ label: "Tất cả đơn vị", options: ["Viên", "Chai", "Hộp", "Tuýp"] }, { label: "Mức tồn", options: ["Còn hàng", "Sắp hết", "Hết hàng"] }]} />
        <PortalTable caption="Thuốc khả dụng tại chi nhánh" columns={["Tên thuốc", "Đơn vị", "Giá", "Số lượng", "Mức tối thiểu", "Khả dụng"]} rows={[
          ["Paracetamol 500mg", "Viên", "1.200 đ", "2.480", "500", <StatusPill key="1" tone="green">Còn hàng</StatusPill>],
          ["Amoxicillin 500mg", "Viên", "2.800 đ", "860", "300", <StatusPill key="2" tone="green">Còn hàng</StatusPill>],
          ["Amlodipine 5mg", "Viên", "3.500 đ", "142", "150", <StatusPill key="3" tone="amber">Sắp hết</StatusPill>],
          ["Natri Clorid 0,9%", "Chai", "18.000 đ", "0", "50", <StatusPill key="4" tone="red">Hết hàng</StatusPill>],
        ]} />
      </PortalSection>
    </div>
  );
}

function DoctorProfileScreen() {
  return (
    <div className="space-y-6">
      <PortalPageHeader eyebrow="Hồ sơ công khai" title="Hồ sơ nghề nghiệp" description="Cập nhật phần thông tin cá nhân được phép. Chi nhánh và chuyên khoa do quản trị viên phân công." actions={<PortalAction variant="default"><Save />Lưu hồ sơ</PortalAction>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <PortalSection title="Thông tin bác sĩ">
          <form className="grid gap-5 p-5 sm:grid-cols-2">
            <Field label="Họ và tên" defaultValue="Nguyễn Hoàng Minh" />
            <Field label="Chuyên môn ngắn" defaultValue="Tim mạch can thiệp" />
            <div className="sm:col-span-2"><Field label="Nơi làm việc" defaultValue="Khoa Tim mạch · Bệnh viện Đa khoa Thành Phố" /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="doctor-introduction">Giới thiệu</Label><Textarea id="doctor-introduction" rows={6} defaultValue="Bác sĩ chuyên khoa Tim mạch với hơn 12 năm kinh nghiệm trong thăm khám và điều trị các bệnh lý tim mạch." /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="doctor-expertise">Kinh nghiệm và chuyên môn</Label><Textarea id="doctor-expertise" rows={7} defaultValue="- Chẩn đoán và điều trị tăng huyết áp\n- Quản lý bệnh mạch vành\n- Theo dõi sau can thiệp tim mạch" /></div>
          </form>
        </PortalSection>
        <PortalSection title="Phân công hiện tại">
          <DetailGrid>
            <DetailItem label="Cơ sở" value="BV Đa khoa Thành Phố" />
            <DetailItem label="Chuyên khoa" value="Tim mạch" />
            <DetailItem label="Giá khám" value="450.000 đ" />
            <DetailItem label="Trạng thái tài khoản" value={<StatusPill tone="green">Hoạt động</StatusPill>} />
          </DetailGrid>
        </PortalSection>
      </div>
    </div>
  );
}

function Field({ label, defaultValue, type = "text" }: { label: string; defaultValue: string; type?: string }) {
  const id = `doctor-${label.toLowerCase().replaceAll(" ", "-")}`;
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} type={type} defaultValue={defaultValue} /></div>;
}
