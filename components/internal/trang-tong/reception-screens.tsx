"use client";

import {
  Banknote,
  BedDouble,
  CalendarCheck2,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Eye,
  Filter,
  PackageCheck,
  Plus,
  ReceiptText,
  RotateCcw,
  Search,
  Trash2,
  UserCheck,
  UsersRound,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  DetailGrid,
  DetailItem,
  MetricCard,
  MetricGrid,
  PortalAction,
  PortalPageHeader,
  PortalSection,
  PortalTable,
  PortalToolbar,
  ProgressList,
  StatusPill,
} from "@/components/internal/portal-ui";
import { EmptyState } from "@/components/shared/data-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mockAppointments } from "@/data/mocks/appointments";
import { mockHospitals } from "@/data/mocks/hospitals";
import { mockRooms } from "@/data/mocks/rooms";
import { formatDate } from "@/lib/format";
import { AppointmentStatus, RoomStatus } from "@/types/models";

export function ReceptionScreens({ slug }: { slug: string }) {
  switch (slug) {
    case "tong-quan": return <StaffDashboard />;
    case "lich-hen": return <StaffAppointmentsScreen />;
    case "tiep-nhan": return <ReceptionScreen />;
    case "phong-kham": return <StaffRoomsScreen />;
    case "thanh-toan-cap-thuoc": return <PaymentDispensingScreen />;
    case "danh-gia": return <StaffReviewsScreen />;
    default: return null;
  }
}

const queueRows = [
  ["A-028", "Nguyễn Thị Lan", "09:30", "Tim mạch · P.203", <StatusPill key="1" tone="blue">Đang chờ</StatusPill>],
  ["A-029", "Lê Minh Châu", "09:45", "Siêu âm · P.307", <StatusPill key="2" tone="green">Đã gọi</StatusPill>],
  ["A-030", "Trần Văn Phúc", "09:45", "Nội tổng quát · Chưa gán", <StatusPill key="3" tone="amber">Cần gán phòng</StatusPill>],
  ["A-031", "Phạm Thị Hồng", "10:00", "Nhi khoa · P.205", <StatusPill key="4" tone="blue">Đang chờ</StatusPill>],
];

function StaffDashboard() {
  return (
    <div className="space-y-6">
      <PortalPageHeader eyebrow="Quầy tiếp nhận số 2" title="Vận hành hôm nay" description="Theo dõi lượt chờ, lịch chưa xác nhận và tình trạng phòng để tiếp nhận nhanh hơn." actions={<PortalAction variant="default"><Plus />Tạo lịch tại quầy</PortalAction>} />
      <MetricGrid>
        <MetricCard label="Chờ tiếp nhận" value="12" detail="Thời gian chờ trung bình 8 phút" icon={<UsersRound className="size-5" />} tone="amber" />
        <MetricCard label="Đã check-in" value="92" detail="Tăng 14 lượt so với hôm qua" trend="up" icon={<UserCheck className="size-5" />} tone="green" />
        <MetricCard label="Lịch chờ xác nhận" value="18" detail="6 lịch trong 2 giờ tới" icon={<CalendarCheck2 className="size-5" />} />
        <MetricCard label="Phòng khả dụng" value="8" detail="Trên tổng số 24 phòng" icon={<BedDouble className="size-5" />} tone="cyan" />
      </MetricGrid>
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <PortalSection title="Hàng chờ hiện tại" action={<PortalAction>Gọi số tiếp theo</PortalAction>}>
          <PortalTable caption="Hàng chờ tiếp nhận" columns={["Số", "Bệnh nhân", "Giờ hẹn", "Khu vực", "Trạng thái"]} rows={queueRows} />
        </PortalSection>
        <PortalSection title="Tiến độ ca sáng">
          <ProgressList items={[
            { label: "Đã tiếp nhận", value: 74, display: "92/124", color: "bg-emerald-500" },
            { label: "Đang chờ", value: 18, display: "12 lượt", color: "bg-amber-500" },
            { label: "Vắng mặt", value: 7, display: "8 lượt", color: "bg-red-400" },
          ]} />
        </PortalSection>
      </div>
    </div>
  );
}

function StaffAppointmentsScreen() {
  return (
    <div className="space-y-6">
      <PortalPageHeader eyebrow="Điều phối lịch" title="Lịch hẹn" description="Tạo lịch thay bệnh nhân, xác nhận, đổi lịch, phân phòng và hủy có lý do." actions={<PortalAction variant="default"><Plus />Tạo lịch mới</PortalAction>} />
      <MetricGrid>
        <MetricCard label="Lịch hôm nay" value="148" detail="3 loại lịch" icon={<CalendarCheck2 className="size-5" />} />
        <MetricCard label="Chờ xác nhận" value="18" detail="6 lịch trong 2 giờ tới" icon={<Clock3 className="size-5" />} tone="amber" />
        <MetricCard label="Đã xác nhận" value="118" detail="79,7% tổng lịch" icon={<CheckCircle2 className="size-5" />} tone="green" />
        <MetricCard label="Cần gán phòng" value="7" detail="Ưu tiên khung 09:30 - 11:00" icon={<BedDouble className="size-5" />} tone="red" />
      </MetricGrid>
      <PortalSection title="Danh sách lịch">
        <PortalToolbar placeholder="Tìm tên, mã lịch hoặc mã y tế" filters={[{ label: "Hôm nay", options: ["Ngày mai", "7 ngày"] }, { label: "Trạng thái", options: ["Chờ xác nhận", "Đã xác nhận", "Đã check-in", "Đã hủy"] }, { label: "Loại lịch", options: ["Bệnh viện", "Bác sĩ", "Dịch vụ"] }]} />
        <PortalTable caption="Lịch hẹn tại chi nhánh" columns={["Mã lịch", "Bệnh nhân", "Thời gian", "Nội dung", "Phòng", "Trạng thái"]} rows={[
          ["APT-10248", "Nguyễn Thị Lan", "09:30", "BS. Nguyễn Hoàng Minh", "P.203", <StatusPill key="1" tone="blue">Đã check-in</StatusPill>],
          ["APT-10249", "Trần Văn Phúc", "09:45", "Khám tổng quát", "Chưa gán", <StatusPill key="2" tone="amber">Chờ xác nhận</StatusPill>],
          ["APT-10250", "Lê Minh Châu", "09:45", "Siêu âm tổng quát", "P.307", <StatusPill key="3" tone="green">Đã xác nhận</StatusPill>],
          ["APT-10251", "Phạm Thị Hồng", "10:00", "BS. Phạm Ngọc Anh", "P.205", <StatusPill key="4" tone="green">Đã xác nhận</StatusPill>],
        ]} />
      </PortalSection>
    </div>
  );
}

function ReceptionScreen() {
  return (
    <div className="space-y-6">
      <PortalPageHeader eyebrow="Tiếp nhận tại quầy" title="Check-in người bệnh" description="Tìm lịch hợp lệ, xác nhận người đến khám và chuyển vào hàng chờ của phòng." />
      <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <PortalSection title="Tra cứu lịch hẹn" description="Nhập mã lịch, mã y tế hoặc số điện thoại.">
          <form className="space-y-4 p-5">
            <div className="space-y-2"><Label htmlFor="reception-search">Thông tin tra cứu</Label><Input id="reception-search" placeholder="Ví dụ: APT-10248" defaultValue="APT-10248" /></div>
            <PortalAction variant="default">Tra cứu lịch</PortalAction>
          </form>
        </PortalSection>
        <PortalSection title="Kết quả tra cứu" action={<StatusPill tone="green">Có thể check-in</StatusPill>}>
          <DetailGrid>
            <DetailItem label="Bệnh nhân" value="Nguyễn Thị Lan" />
            <DetailItem label="Mã y tế" value="BN-10248" />
            <DetailItem label="Thời gian" value="09:30 · 23/09/2026" />
            <DetailItem label="Nội dung" value="Khám BS. Nguyễn Hoàng Minh" />
            <DetailItem label="Phòng" value="P.203 · Khu B, tầng 2" />
            <DetailItem label="Trạng thái" value={<StatusPill tone="blue">Đã xác nhận</StatusPill>} />
          </DetailGrid>
          <div className="flex flex-wrap justify-end gap-2 border-t p-5"><PortalAction>Đổi phòng</PortalAction><PortalAction variant="default"><UserCheck />Xác nhận check-in</PortalAction></div>
        </PortalSection>
      </div>
      <PortalSection title="Hàng chờ sau check-in">
        <PortalTable caption="Hàng chờ sau check-in" columns={["Số", "Bệnh nhân", "Giờ hẹn", "Khu vực", "Trạng thái"]} rows={queueRows} />
      </PortalSection>
    </div>
  );
}

function StaffRoomsScreen() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | RoomStatus>("all");
  const [hospitalFilter, setHospitalFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;

  // Ghép thông tin cơ sở và số lượt đang chờ cho mỗi phòng.
  const roomsWithDetails = useMemo(() => {
    const hospitalNameByUuid = new Map(
      mockHospitals.map((hospital) => [hospital.Uuid, hospital.Name] as const),
    );
    const waitingByRoom = new Map<string, number>();
    for (const appointment of mockAppointments) {
      if (
        !appointment.RoomUuid ||
        appointment.DeletedAt.getTime() !== 0 ||
        appointment.Status === AppointmentStatus.Cancelled ||
        appointment.Status === AppointmentStatus.Done
      ) {
        continue;
      }
      waitingByRoom.set(
        appointment.RoomUuid,
        (waitingByRoom.get(appointment.RoomUuid) ?? 0) + 1,
      );
    }
    return mockRooms.map((room) => ({
      ...room,
      HospitalName: hospitalNameByUuid.get(room.HospitalUuid) ?? "Chưa gán",
      Waiting: waitingByRoom.get(room.Uuid) ?? 0,
    }));
  }, []);

  const filteredRooms = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi-VN");
    return roomsWithDetails.filter((room) => {
      if (statusFilter !== "all" && room.Status !== statusFilter) return false;
      if (hospitalFilter !== "all" && room.HospitalUuid !== hospitalFilter) return false;
      if (keyword) {
        const haystack = `${room.Name} ${room.HospitalName}`.toLocaleLowerCase("vi-VN");
        if (!haystack.includes(keyword)) return false;
      }
      return true;
    });
  }, [hospitalFilter, roomsWithDetails, search, statusFilter]);

  // Khi bộ lọc thay đổi, đưa về trang đầu thông qua bộ đếm an toàn.
  const totalPages = Math.max(1, Math.ceil(filteredRooms.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const paginatedRooms = filteredRooms.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const counts = useMemo(() => {
    return {
      total: filteredRooms.length,
      available: filteredRooms.filter((room) => room.Status === RoomStatus.Available).length,
      occupied: filteredRooms.filter((room) => room.Status === RoomStatus.Occupied).length,
      maintenance: filteredRooms.filter((room) => room.Status === RoomStatus.Maintenance).length,
      waiting: filteredRooms.reduce((sum, room) => sum + room.Waiting, 0),
    };
  }, [filteredRooms]);

  const isFiltered = Boolean(search.trim()) || statusFilter !== "all" || hospitalFilter !== "all";

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    setHospitalFilter("all");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PortalPageHeader
        eyebrow="Sơ đồ vận hành"
        title="Tình trạng phòng khám"
        description="Theo dõi phòng khả dụng, phòng đang sử dụng và hàng chờ hiện tại để tiếp nhận nhanh hơn."
      />

      <MetricGrid>
        <MetricCard
          label="Tổng phòng đang xem"
          value={String(counts.total)}
          detail={isFiltered ? `Đang lọc trên ${roomsWithDetails.length} phòng` : `${mockRooms.length} phòng đang hoạt động`}
          icon={<BedDouble className="size-5" />}
          tone="blue"
        />
        <MetricCard
          label="Khả dụng"
          value={String(counts.available)}
          detail="Sẵn sàng tiếp nhận lượt mới"
          icon={<CheckCircle2 className="size-5" />}
          tone="green"
        />
        <MetricCard
          label="Đang sử dụng"
          value={String(counts.occupied)}
          detail={`${counts.waiting} lượt đang chờ trong khu vực`}
          icon={<UsersRound className="size-5" />}
          tone="cyan"
        />
        <MetricCard
          label="Bảo trì"
          value={String(counts.maintenance)}
          detail="Cần thông báo cho nhân sự kỹ thuật"
          icon={<Wrench className="size-5" />}
          tone="amber"
        />
      </MetricGrid>

      <PortalSection
        title="Danh sách phòng khám"
        description={
          filteredRooms.length
            ? `${filteredRooms.length} phòng khớp với bộ lọc, hiển thị ${paginatedRooms.length} phòng trên trang ${safePage}/${totalPages}.`
            : "Không có phòng nào khớp với bộ lọc hiện tại."
        }
        action={
          isFiltered ? (
            <Button type="button" size="sm" variant="outline" onClick={resetFilters}>
              <Filter aria-hidden="true" className="size-4" />
              Đặt lại bộ lọc
            </Button>
          ) : null
        }
      >
        <div className="flex flex-col gap-3 border-b bg-[#fbfdfe] p-4 lg:flex-row lg:items-end">
          <label className="min-w-0 flex-1 lg:max-w-sm">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tìm kiếm</span>
            <div className="relative">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm theo tên phòng hoặc tên cơ sở"
                className="h-9 pl-9"
                aria-label="Tìm theo tên phòng hoặc tên cơ sở"
              />
            </div>
          </label>
          <label className="lg:w-52">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Trạng thái</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | RoomStatus)}
              className="h-9 w-full rounded-md border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              aria-label="Lọc theo trạng thái phòng"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value={RoomStatus.Available}>Khả dụng</option>
              <option value={RoomStatus.Occupied}>Đang sử dụng</option>
              <option value={RoomStatus.Maintenance}>Bảo trì</option>
            </select>
          </label>
          <label className="lg:w-64">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cơ sở y tế</span>
            <select
              value={hospitalFilter}
              onChange={(event) => setHospitalFilter(event.target.value)}
              className="h-9 w-full rounded-md border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              aria-label="Lọc theo cơ sở y tế"
            >
              <option value="all">Tất cả cơ sở</option>
              {mockHospitals.map((hospital) => (
                <option key={hospital.Uuid} value={hospital.Uuid}>
                  {hospital.Name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {paginatedRooms.length ? (
          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {paginatedRooms.map((room) => (
              <article key={room.Uuid} className="flex h-full flex-col border bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-lg font-bold text-[#173b57]">{room.Name}</p>
                    <p className="mt-1 break-words text-sm text-muted-foreground">{room.HospitalName}</p>
                  </div>
                  {room.Status === RoomStatus.Available ? (
                    <StatusPill tone="green">Khả dụng</StatusPill>
                  ) : room.Status === RoomStatus.Occupied ? (
                    <StatusPill tone="blue">Đang sử dụng</StatusPill>
                  ) : (
                    <StatusPill tone="amber">Bảo trì</StatusPill>
                  )}
                </div>
                <div className="mt-5 flex flex-1 items-end justify-between gap-3 border-t pt-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Đang chờ</p>
                    <p className="mt-1 text-xl font-bold text-[#173b57]">{room.Waiting}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Cập nhật</p>
                    <p className="mt-1 text-sm font-medium text-foreground">{formatDate(room.UpdatedAt)}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            message="Không có phòng nào khớp với bộ lọc hiện tại."
            action={
              <Button type="button" variant="outline" onClick={resetFilters}>
                Đặt lại bộ lọc
              </Button>
            }
          />
        )}

        {totalPages > 1 ? (
          <nav aria-label="Phân trang phòng khám" className="flex flex-col gap-3 border-t bg-[#fbfdfe] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Hiển thị <strong>{(safePage - 1) * PAGE_SIZE + 1}</strong>-
              <strong>{Math.min(safePage * PAGE_SIZE, filteredRooms.length)}</strong> trên tổng số{" "}
              <strong>{filteredRooms.length}</strong> phòng
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="outline" disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))}>
                Trước
              </Button>
              <span className="text-sm font-medium text-[#173b57]">
                Trang {safePage} / {totalPages}
              </span>
              <Button type="button" size="sm" variant="outline" disabled={safePage >= totalPages} onClick={() => setPage((value) => Math.min(value + 1, totalPages))}>
                Sau
              </Button>
            </div>
          </nav>
        ) : null}
      </PortalSection>
    </div>
  );
}

type PaymentPrescription = {
  code: string;
  patient: string;
  medicalId: string;
  doctor: string;
  prescribedAt: string;
  note: string;
  medicines: { name: string; dosage: string; quantity: number; unit: string; price: number; external?: boolean }[];
  status: "unpaid" | "paid";
  payment?: { method: string; amount: number; paidAt: string; reference: string };
  DeletedAt: Date;
};

const paymentPrescriptions: PaymentPrescription[] = [
  {
    code: "RX-260923-074",
    patient: "Nguyễn Thị Lan",
    medicalId: "BN-10248",
    doctor: "BS. Nguyễn Hoàng Minh",
    prescribedAt: "23/09/2026 · 09:52",
    note: "Uống thuốc sau ăn và tái khám nếu triệu chứng không giảm.",
    medicines: [
      { name: "Paracetamol 500mg", dosage: "1 viên · 2 lần/ngày · 5 ngày", quantity: 10, unit: "Viên", price: 1200 },
      { name: "Amlodipine 5mg", dosage: "1 viên · 1 lần/ngày · 30 ngày", quantity: 30, unit: "Viên", price: 9800 },
      { name: "Omeprazole 20mg", dosage: "1 viên · 1 lần/ngày · 30 ngày", quantity: 30, unit: "Viên", price: 6000 },
    ],
    status: "unpaid",
    DeletedAt: new Date(0),
  },
  {
    code: "RX-260923-073",
    patient: "Lê Minh Châu",
    medicalId: "BN-10931",
    doctor: "BS. Trần Thanh Vũ",
    prescribedAt: "23/09/2026 · 09:38",
    note: "Dùng đủ liệu trình, không tự ý ngưng thuốc.",
    medicines: [
      { name: "Celecoxib 200mg", dosage: "1 viên · 1 lần/ngày · 7 ngày", quantity: 7, unit: "Viên", price: 24000 },
      { name: "Calcium D3", dosage: "1 viên · 2 lần/ngày · 20 ngày", quantity: 40, unit: "Viên", price: 4000 },
    ],
    status: "paid",
    payment: { method: "Chuyển khoản", amount: 328000, paidAt: "23/09/2026 · 09:44", reference: "CK-923073" },
    DeletedAt: new Date(0),
  },
  {
    code: "RX-260923-071",
    patient: "Phạm Minh Đức",
    medicalId: "BN-10472",
    doctor: "BS. Nguyễn Hoàng Minh",
    prescribedAt: "23/09/2026 · 09:21",
    note: "Một thuốc mua ngoài; quầy chỉ thu các thuốc có sẵn.",
    medicines: [
      { name: "Losartan 50mg", dosage: "1 viên · 1 lần/ngày · 30 ngày", quantity: 30, unit: "Viên", price: 7500 },
      { name: "Atorvastatin 20mg", dosage: "1 viên buổi tối · 30 ngày", quantity: 30, unit: "Viên", price: 10000 },
      { name: "Aspirin 81mg", dosage: "1 viên · 1 lần/ngày · 30 ngày", quantity: 30, unit: "Viên", price: 2500 },
      { name: "Coenzyme Q10", dosage: "1 viên · 1 lần/ngày · 30 ngày", quantity: 30, unit: "Viên", price: 0, external: true },
    ],
    status: "unpaid",
    DeletedAt: new Date(0),
  },
  {
    code: "RX-260923-068",
    patient: "Trần Thu Hương",
    medicalId: "BN-10186",
    doctor: "BS. Phạm Ngọc Anh",
    prescribedAt: "23/09/2026 · 08:46",
    note: "Đơn được lưu trữ sau khi người bệnh yêu cầu hủy nhận thuốc.",
    medicines: [{ name: "Cetirizine 10mg", dosage: "1 viên buổi tối · 10 ngày", quantity: 10, unit: "Viên", price: 8600 }],
    status: "unpaid",
    DeletedAt: new Date("2026-09-23T02:10:00.000Z"),
  },
];

const formatMoney = (amount: number) => `${new Intl.NumberFormat("vi-VN").format(amount)} đ`;
const prescriptionTotal = (prescription: PaymentPrescription) => prescription.medicines.reduce((sum, medicine) => sum + medicine.quantity * medicine.price, 0);

function PaymentDispensingScreen() {
  const [prescriptions, setPrescriptions] = useState(() => paymentPrescriptions.map((item) => ({ ...item })));
  const [selectedCode, setSelectedCode] = useState(paymentPrescriptions[0].code);
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState<"active" | "deleted">("active");
  const [method, setMethod] = useState("Tiền mặt");
  const [amount, setAmount] = useState(String(prescriptionTotal(paymentPrescriptions[0])));
  const [message, setMessage] = useState("");

  const selected = prescriptions.find((item) => item.code === selectedCode) ?? prescriptions[0];
  const selectedTotal = prescriptionTotal(selected);
  const activePrescriptions = prescriptions.filter((item) => item.DeletedAt.getTime() === 0);
  const visiblePrescriptions = prescriptions.filter((item) => {
    const matchesVisibility = visibility === "deleted" ? item.DeletedAt.getTime() !== 0 : item.DeletedAt.getTime() === 0;
    const keyword = search.trim().toLocaleLowerCase("vi");
    return matchesVisibility && (!keyword || `${item.code} ${item.patient} ${item.medicalId}`.toLocaleLowerCase("vi").includes(keyword));
  });

  function selectPrescription(prescription: PaymentPrescription) {
    setSelectedCode(prescription.code);
    setAmount(String(prescriptionTotal(prescription)));
    setMethod("Tiền mặt");
    setMessage("");
  }

  function toggleDeleted(prescription: PaymentPrescription) {
    const restoring = prescription.DeletedAt.getTime() !== 0;
    setPrescriptions((current) => current.map((item) => item.code === prescription.code ? { ...item, DeletedAt: restoring ? new Date(0) : new Date() } : item));
    setMessage(restoring ? "Đã khôi phục đơn thuốc vào hàng chờ." : "Đã lưu trữ đơn thuốc. Bạn có thể khôi phục trong mục Đã xóa.");
  }

  function confirmPayment() {
    const paidAmount = Number(amount);
    if (!Number.isFinite(paidAmount) || paidAmount < selectedTotal) {
      setMessage(`Số tiền thu phải từ ${formatMoney(selectedTotal)}.`);
      return;
    }

    const paidAt = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date());
    setPrescriptions((current) => current.map((item) => item.code === selected.code ? {
      ...item,
      status: "paid",
      payment: { method, amount: paidAmount, paidAt, reference: `TT-${item.code.slice(-3)}-${Date.now().toString().slice(-4)}` },
    } : item));
    setMessage("Thanh toán thành công. Đơn đã chuyển sang chờ cấp thuốc.");
  }

  return (
    <div className="space-y-6">
      <PortalPageHeader eyebrow="Đơn thuốc tại quầy" title="Thanh toán và cấp thuốc" description="Thu tiền và cấp thuốc theo đơn đã được bác sĩ tạo; không chỉnh sửa nội dung đơn." />
      <MetricGrid>
        <MetricCard label="Chờ thanh toán" value={String(activePrescriptions.filter((item) => item.status === "unpaid").length)} detail="Đơn đang hoạt động tại quầy" icon={<CircleDollarSign className="size-5" />} tone="amber" />
        <MetricCard label="Chờ cấp thuốc" value={String(activePrescriptions.filter((item) => item.status === "paid").length)} detail="Đã thu tiền, sẵn sàng cấp" icon={<PackageCheck className="size-5" />} />
        <MetricCard label="Hoàn tất hôm nay" value="58" detail="Tổng giá trị 18,6 triệu" trend="up" icon={<CheckCircle2 className="size-5" />} tone="green" />
        <MetricCard label="Thời gian trung bình" value="6 phút" detail="Từ thanh toán đến cấp thuốc" icon={<Clock3 className="size-5" />} tone="cyan" />
      </MetricGrid>
      <PortalSection title="Hàng chờ xử lý" description={`${visiblePrescriptions.length} đơn ${visibility === "active" ? "đang hoạt động" : "đã xóa"}`}>
        <div className="flex flex-col gap-3 border-b bg-[#fbfdfe] p-4 lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1 lg:max-w-sm">
            <span className="sr-only">Tìm mã đơn, bệnh nhân hoặc mã y tế</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm mã đơn, bệnh nhân hoặc mã y tế" className="h-9 pl-9" />
          </label>
          <label>
            <span className="sr-only">Phạm vi hiển thị</span>
            <select value={visibility} onChange={(event) => setVisibility(event.target.value as "active" | "deleted")} className="h-9 rounded-md border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15">
              <option value="active">Đơn đang hoạt động</option>
              <option value="deleted">Đơn đã xóa</option>
            </select>
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[68rem] border-collapse text-left text-sm">
            <caption className="sr-only">Đơn chờ thanh toán và cấp thuốc</caption>
            <thead><tr className="border-b bg-[#f6f9fb] text-xs uppercase tracking-wide text-muted-foreground">
              {["Mã đơn", "Bệnh nhân", "Bác sĩ / ngày kê", "Thuốc", "Tổng tiền", "Kho", "Trạng thái", "Thao tác"].map((column) => <th key={column} scope="col" className="px-5 py-3 font-semibold">{column}</th>)}
            </tr></thead>
            <tbody className="divide-y">
              {visiblePrescriptions.map((prescription) => {
                const externalCount = prescription.medicines.filter((medicine) => medicine.external).length;
                return (
                  <tr key={prescription.code} onClick={() => selectPrescription(prescription)} className={`cursor-pointer transition-colors hover:bg-[#f8fbfc] ${selected.code === prescription.code ? "bg-cyan-50/60" : ""}`}>
                    <td className="px-5 py-4 align-top font-semibold text-primary">{prescription.code}</td>
                    <td className="px-5 py-4 align-top"><p className="font-medium">{prescription.patient}</p><p className="mt-1 text-xs text-muted-foreground">{prescription.medicalId}</p></td>
                    <td className="px-5 py-4 align-top"><p>{prescription.doctor}</p><p className="mt-1 text-xs text-muted-foreground">{prescription.prescribedAt}</p></td>
                    <td className="px-5 py-4 align-top"><p className="font-medium">{prescription.medicines.length} loại</p><p className="mt-1 max-w-44 truncate text-xs text-muted-foreground">{prescription.medicines.map((medicine) => medicine.name).join(", ")}</p></td>
                    <td className="whitespace-nowrap px-5 py-4 align-top font-semibold">{formatMoney(prescriptionTotal(prescription))}</td>
                    <td className="px-5 py-4 align-top"><StatusPill tone={externalCount ? "amber" : "green"}>{externalCount ? `${externalCount} thuốc ngoài` : "Đủ thuốc"}</StatusPill></td>
                    <td className="px-5 py-4 align-top"><StatusPill tone={prescription.status === "paid" ? "blue" : "amber"}>{prescription.status === "paid" ? "Đã thanh toán" : "Chờ thanh toán"}</StatusPill></td>
                    <td className="px-5 py-4 align-top"><div className="flex gap-1">
                      <Button type="button" size="icon-sm" variant="ghost" aria-label={`Xem ${prescription.code}`}><Eye /></Button>
                      <Button type="button" size="icon-sm" variant={prescription.DeletedAt.getTime() ? "outline" : "destructive"} aria-label={prescription.DeletedAt.getTime() ? `Khôi phục ${prescription.code}` : `Xóa ${prescription.code}`} onClick={(event) => { event.stopPropagation(); selectPrescription(prescription); toggleDeleted(prescription); }}>{prescription.DeletedAt.getTime() ? <RotateCcw /> : <Trash2 />}</Button>
                    </div></td>
                  </tr>
                );
              })}
              {!visiblePrescriptions.length ? <tr><td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">Không tìm thấy đơn thuốc phù hợp.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </PortalSection>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <PortalSection title={`Chi tiết ${selected.code}`} description={`${selected.patient} · ${selected.medicalId}`} action={<StatusPill tone={selected.status === "paid" ? "green" : selected.DeletedAt.getTime() ? "red" : "amber"}>{selected.DeletedAt.getTime() ? "Đã xóa" : selected.status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}</StatusPill>}>
          <DetailGrid>
            <DetailItem label="Bác sĩ kê đơn" value={selected.doctor} />
            <DetailItem label="Ngày kê" value={selected.prescribedAt} />
            <DetailItem label="Ghi chú" value={selected.note} />
            <DetailItem label="Khả dụng" value={selected.medicines.some((medicine) => medicine.external) ? "Có thuốc người bệnh mua ngoài" : "Đủ thuốc tại quầy"} />
          </DetailGrid>
          <div className="overflow-x-auto border-t">
            <table className="w-full min-w-[42rem] text-left text-sm">
              <thead><tr className="border-b bg-[#f6f9fb] text-xs uppercase tracking-wide text-muted-foreground"><th className="px-5 py-3">Thuốc và cách dùng</th><th className="px-5 py-3">Số lượng</th><th className="px-5 py-3 text-right">Đơn giá</th><th className="px-5 py-3 text-right">Thành tiền</th></tr></thead>
              <tbody className="divide-y">{selected.medicines.map((medicine) => <tr key={medicine.name}><td className="px-5 py-4"><p className="font-medium">{medicine.name}</p><p className="mt-1 text-xs text-muted-foreground">{medicine.dosage}</p>{medicine.external ? <p className="mt-1 text-xs font-semibold text-amber-700">Mua ngoài, không thu tại quầy</p> : null}</td><td className="px-5 py-4">{medicine.quantity} {medicine.unit.toLocaleLowerCase("vi")}</td><td className="px-5 py-4 text-right">{formatMoney(medicine.price)}</td><td className="px-5 py-4 text-right font-medium">{formatMoney(medicine.quantity * medicine.price)}</td></tr>)}</tbody>
              <tfoot><tr className="border-t bg-[#fbfdfe]"><td colSpan={3} className="px-5 py-4 text-right font-semibold">Tổng thanh toán</td><td className="px-5 py-4 text-right text-lg font-bold text-[#173b57]">{formatMoney(selectedTotal)}</td></tr></tfoot>
            </table>
          </div>
        </PortalSection>

        <PortalSection title="Thanh toán" description="Xác nhận số tiền trước khi chuyển đơn sang cấp thuốc.">
          <div className="space-y-5 p-5">
            {selected.DeletedAt.getTime() !== 0 ? (
              <div className="space-y-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p>Đơn đã được xóa và không thể thanh toán.</p><Button type="button" variant="outline" onClick={() => toggleDeleted(selected)}><RotateCcw />Khôi phục đơn</Button></div>
            ) : selected.status === "paid" && selected.payment ? (
              <div className="space-y-4">
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4"><div className="flex items-center gap-2 font-semibold text-emerald-800"><CheckCircle2 className="size-5" />Đã thu tiền thành công</div><p className="mt-2 text-sm leading-6 text-emerald-700">Đơn đang chờ dược sĩ kiểm tra và cấp thuốc.</p></div>
                <dl className="space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Phương thức</dt><dd className="font-medium">{selected.payment.method}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Số tiền</dt><dd className="font-semibold">{formatMoney(selected.payment.amount)}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Mã giao dịch</dt><dd className="font-medium">{selected.payment.reference}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Thời gian</dt><dd className="text-right font-medium">{selected.payment.paidAt}</dd></div></dl>
                <Button type="button" variant="outline" className="w-full"><ReceiptText />Xem biên nhận</Button>
              </div>
            ) : (
              <>
                <div className="space-y-2"><Label htmlFor="payment-method">Phương thức thanh toán</Label><select id="payment-method" value={method} onChange={(event) => setMethod(event.target.value)} className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"><option>Tiền mặt</option><option>Chuyển khoản</option><option>Thẻ ngân hàng</option></select></div>
                <div className="space-y-2"><Label htmlFor="payment-amount">Số tiền thu</Label><div className="relative"><Banknote className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="payment-amount" type="number" min={selectedTotal} step="1000" value={amount} onChange={(event) => { setAmount(event.target.value); setMessage(""); }} className="pl-9 pr-8" /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">đ</span></div></div>
                <div className="rounded-md bg-[#f6f9fb] p-4 text-sm"><div className="flex justify-between gap-4"><span className="text-muted-foreground">Cần thanh toán</span><strong>{formatMoney(selectedTotal)}</strong></div><div className="mt-2 flex justify-between gap-4"><span className="text-muted-foreground">Tiền thừa</span><strong>{formatMoney(Math.max(0, Number(amount) - selectedTotal || 0))}</strong></div></div>
                <Button type="button" className="w-full" disabled={!amount || Number(amount) < selectedTotal} onClick={confirmPayment}>{method === "Tiền mặt" ? <Banknote /> : <CreditCard />}Xác nhận thanh toán</Button>
              </>
            )}
            {message ? <p role="status" className={`text-sm font-medium ${message.includes("thành công") || message.includes("khôi phục") ? "text-emerald-700" : message.includes("phải") ? "text-red-700" : "text-amber-700"}`}>{message}</p> : null}
          </div>
        </PortalSection>
      </div>
    </div>
  );
}

function StaffReviewsScreen() {
  return (
    <div className="space-y-6">
      <PortalPageHeader eyebrow="Quyền được giao" title="Hỗ trợ kiểm duyệt đánh giá" description="Đánh dấu đã xem và ẩn nội dung vi phạm theo quyền được quản trị viên chi nhánh cấp." />
      <PortalSection title="Đánh giá chưa xem" description="12 đánh giá đang chờ xử lý">
        <PortalToolbar placeholder="Tìm nội dung" filters={[{ label: "Tất cả số sao", options: ["5 sao", "4 sao", "1-3 sao"] }]} />
        <PortalTable caption="Đánh giá chưa xem" columns={["Người đánh giá", "Đối tượng", "Nội dung", "Điểm", "Ngày tạo"]} rows={[
          ["Nguyễn T. L.", "BS. Nguyễn Hoàng Minh", "Bác sĩ tư vấn kỹ, dễ hiểu.", <StatusPill key="1" tone="green">5 sao</StatusPill>, "23/09 09:20"],
          ["Trần V. P.", "Siêu âm tổng quát", "Thời gian chờ hơi lâu.", <StatusPill key="2" tone="green">4 sao</StatusPill>, "23/09 08:42"],
          ["Lê M. C.", "BV Đa khoa Thành Phố", "Quy trình tiếp nhận thuận tiện.", <StatusPill key="3" tone="green">5 sao</StatusPill>, "22/09 18:10"],
          ["Phạm T. H.", "Khoa Nhi", "Khó tìm khu vực phòng khám.", <StatusPill key="4" tone="amber">2 sao</StatusPill>, "22/09 16:34"],
        ]} />
      </PortalSection>
    </div>
  );
}
