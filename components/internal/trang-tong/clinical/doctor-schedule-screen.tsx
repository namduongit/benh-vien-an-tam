import {
    PortalAction,
    PortalPageHeader,
    PortalSection,
    PortalTable,
    PortalToolbar,
} from "@/components/internal/portal-ui";

const scheduleRows = [
    ["08:00", "Lê Văn Hùng", "Khám tổng quát", "P.203", "Đã xác nhận"],
    ["09:30", "Nguyễn Thị Lan", "Khám theo bác sĩ", "P.203", "Đã check-in"],
    ["10:15", "Trần Văn Bình", "Tái khám tim mạch", "P.203", "Hoàn thành"],
];

export function DoctorScheduleScreen() {
    return (
        <div className= "space-y-6" >
        <PortalPageHeader
        eyebrow="Ca được phân công"
    title = "Lịch khám của tôi"
    description = "Chỉ hiển thị lịch được phân công trực tiếp cho tài khoản bác sĩ hiện tại."
    actions = {
          <>
        <PortalAction>Đề xuất đổi lịch </PortalAction>
            < PortalAction variant = "default" > In lịch hôm nay </PortalAction>
                </>
}
      />

    < div className = "grid gap-4 sm:grid-cols-3" >
    {
        ["Thứ Tư\n23/09", "Thứ Năm\n24/09", "Thứ Sáu\n25/09"].map((date, index) => (
            <button
            key= { date }
            className = {`whitespace-pre-line border p-4 text-left text-sm font-semibold ${index === 0
                    ? "border-primary bg-secondary text-primary"
                    : "bg-white hover:bg-muted/40"
                }`}
        >
    { date }
        < span className = "mt-2 block text-xs font-normal text-muted-foreground" >
        { ["12 ca khám", "9 ca khám", "7 ca khám"][index] }
            </span>
            </button>
        ))}
</div>

    < PortalSection
title = "Thứ Tư, 23/09/2026"
description = "07:30 - 11:45 · Phòng 203"
    >
    <PortalToolbar
          placeholder="Tìm bệnh nhân hoặc mã y tế"
filters = {
    [
    {
        label: "Tất cả trạng thái",
        options: ["Đã xác nhận", "Đã check-in", "Hoàn thành"],
    },
          ]}
    />
    <PortalTable
          caption="Lịch khám của bác sĩ"
columns = { ["Giờ", "Bệnh nhân", "Loại", "Phòng", "Trạng thái"]}
rows = { scheduleRows }
    />
    </PortalSection>
    </div>
  );
}