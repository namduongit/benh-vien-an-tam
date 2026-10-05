import {
    MetricCard,
    MetricGrid,
    PortalPageHeader,
    PortalSection,
    PortalTable,
    PortalToolbar,
    StatusPill,
} from "@/components/internal/portal-ui";
import { Activity, CheckCircle2, Clock3, Pill } from "lucide-react";

export function DoctorPrescriptionsScreen() {
    return (
        <div className= "space-y-6" >
        <PortalPageHeader
        eyebrow="Đơn do tôi kê"
    title = "Đơn thuốc"
    description = "Quản lý đơn thuốc thuộc các ca được phân công; đơn đã thanh toán chỉ được xem."
        />

        <MetricGrid>
        <MetricCard
          label="Đơn tháng này"
    value = "186"
    detail = "Tăng 12 đơn so với tháng trước"
    trend = "up"
    icon = {< Pill className = "size-5" />}
        />
    < MetricCard
label = "Chưa thanh toán"
value = "8"
detail = "Có thể chỉnh sửa hoặc hủy"
icon = {< Clock3 className = "size-5" />}
tone = "amber"
    />
    <MetricCard
          label="Đã thanh toán"
value = "174"
detail = "Chỉ đọc"
icon = {< CheckCircle2 className = "size-5" />}
tone = "green"
    />
    <MetricCard
          label="Đã hủy"
value = "4"
detail = "Đều có ghi nhận lý do"
icon = {< Activity className = "size-5" />}
tone = "red"
    />
    </MetricGrid>

    < PortalSection title = "Danh sách đơn thuốc" >
        <PortalToolbar
          placeholder="Tìm mã đơn hoặc bệnh nhân"
filters = {
    [
    {
        label: "Tháng này",
        options: ["Hôm nay", "7 ngày", "3 tháng"],
    },
    {
        label: "Tất cả trạng thái",
        options: ["Chưa thanh toán", "Đã thanh toán", "Đã hủy"],
    },
          ]}
    />
    <PortalTable
          caption="Đơn thuốc của bác sĩ"
columns = {
    [
    "Mã đơn",
    "Bệnh nhân",
    "Ngày kê",
    "Số thuốc",
    "Tổng tiền",
    "Trạng thái",
          ]}
rows = {
    [
    [
        "RX-260923-074",
        "Nguyễn Thị Lan",
        "23/09 09:52",
        "3",
        "486.000 đ",
        <StatusPill key="1" tone = "amber" >
        Chưa thanh toán
        </StatusPill>,
    ],
    [
        "RX-260923-069",
        "Lê Thị Thanh",
        "23/09 08:58",
        "2",
        "215.000 đ",
        <StatusPill key="2" tone = "green" >
        Đã thanh toán
        </StatusPill>,
    ],
    [
        "RX-260923-064",
        "Nguyễn Văn Hải",
        "23/09 08:24",
        "4",
        "624.000 đ",
        <StatusPill key="3" tone = "green" >
        Đã thanh toán
        </StatusPill>,
    ],
    [
        "RX-260922-182",
        "Trần Minh Đức",
        "22/09 16:42",
        "1",
        "0 đ",
        <StatusPill key="4" tone = "red" >
        Đã hủy
        </StatusPill>,
    ],
          ]}
    />
    </PortalSection>
    </div>
  );
}