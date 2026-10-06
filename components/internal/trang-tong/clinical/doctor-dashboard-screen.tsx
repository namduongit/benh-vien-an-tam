import {
    MetricCard,
    MetricGrid,
    PortalAction,
    PortalPageHeader,
    PortalSection,
    PortalTable,
    ProgressList,
} from "@/components/internal/portal-ui";
import { CalendarCheck2, CheckCircle2, Clock3, Pill } from "lucide-react";

// Dữ liệu mẫu cho danh sách lịch khám
const scheduleRows = [
    ["08:00", "Lê Văn Hùng", "Khám tổng quát", "P.203", "Đã xác nhận"],
    ["08:45", "Trần Thị Mai", "Tái khám", "P.203", "Hoàn thành"],
    ["09:30", "Nguyễn Thị Lan", "Khám theo bác sĩ", "P.203", "Đã check-in"],
    ["10:15", "Trần Văn Bình", "Tái khám tim mạch", "P.203", "Chưa đến"],
    ["11:00", "Phạm Hoàng Nam", "Khám tổng quát", "P.203", "Chưa đến"],
];

export function DoctorDashboard() {
    return (
        <div className= "space-y-6" >
        <PortalPageHeader
        eyebrow="Thứ Tư, 23 tháng 09"
    title = "Chào buổi sáng, BS. Nguyễn Hoàng Minh"
    description = "Bạn có 12 ca khám được phân công hôm nay tại phòng 203, Khoa Tim mạch."
    actions = {
          < PortalAction variant = "default" > Bắt đầu ca tiếp theo </PortalAction>
}
      />

    < MetricGrid >
    <MetricCard
          label="Ca hôm nay"
value = "12"
detail = "5 ca còn lại"
icon = {< CalendarCheck2 className = "size-5" />}
        />
    < MetricCard
label = "Đã hoàn thành"
value = "7"
detail = "58% lịch trong ngày"
trend = "up"
icon = {< CheckCircle2 className = "size-5" />}
tone = "green"
    />
    <MetricCard
          label="Đang chờ"
value = "2"
detail = "Ca tiếp theo lúc 09:30"
icon = {< Clock3 className = "size-5" />}
tone = "amber"
    />
    <MetricCard
          label="Đơn đã kê"
value = "6"
detail = "1 đơn chưa thanh toán"
icon = {< Pill className = "size-5" />}
tone = "cyan"
    />
    </MetricGrid>

    < div className = "grid gap-6 xl:grid-cols-[1.35fr_0.65fr]" >
        <PortalSection
          title="Lịch khám tiếp theo"
action = {< PortalAction > Xem toàn bộ lịch </PortalAction>}
        >
    <PortalTable
            caption="Lịch khám tiếp theo"
columns = { ["Giờ", "Bệnh nhân", "Loại", "Phòng", "Trạng thái"]}
rows = { scheduleRows.slice(2) }
    />
    </PortalSection>

    < PortalSection title = "Tiến độ hôm nay" >
        <ProgressList
            items={
    [
        {
            label: "Hoàn thành",
            value: 58,
            display: "7/12",
            color: "bg-emerald-500",
        },
        { label: "Đã check-in", value: 17, display: "2/12" },
        {
            label: "Chưa đến",
            value: 25,
            display: "3/12",
            color: "bg-amber-500",
        },
    ]
}
          />
    < div className = "border-t p-5 text-sm" >
        <p className="font-semibold" > Ca gần nhất </p>
            < p className = "mt-2 text-muted-foreground" >
              09: 30 · Nguyễn Thị Lan · P.203
    </p>
    </div>
    </PortalSection>
    </div>
    </div>
  );
}