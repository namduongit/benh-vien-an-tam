"use client";

import { CalendarClock, Check, FilePenLine, Pencil, Plus, RotateCcw, Send, Trash2, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { mockDoctorWorkings } from "@/data/mocks/doctor-workings";
import { mockHospitalWorkings } from "@/data/mocks/hospital-workings";
import { mockServiceWorkings } from "@/data/mocks/service-workings";
import { mockTimeWorkings } from "@/data/mocks/time-workings";
import { PortalAction, PortalPageHeader, PortalSection, PortalTable, StatusPill } from "@/components/internal/portal-ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  adminTimeWorkingService,
  type AdminTimeWorkingItem,
} from "@/lib/services/time-working/AdminTimeWorkingService";
import { BaseStatus, type TimeWorking } from "@/types/models";

const dayNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

export function TimeWorkingCatalogScreen() {
  const [workings, setWorkings] = useState<TimeWorking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<TimeWorking | null>(null);
  const [visibility, setVisibility] = useState<"current" | "deleted">("current");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    adminTimeWorkingService.getAll(controller.signal)
      .then((response) => {
        if (!active) return;
        setWorkings((response.data ?? response.Data ?? []).map(mapTimeWorking));
      })
      .catch((requestError) => {
        if (!active) return;
        console.error("Lỗi khi tải khung giờ làm việc:", requestError);
        setError("Không tải được danh sách khung giờ làm việc");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  async function saveWorking(value: ScheduleFormValue) {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        dayOfWeek: value.dayOfWeek,
        startTime: value.startTime,
        endTime: value.endTime,
        status: BaseStatus.Active,
      };
      const response = editing
        ? await adminTimeWorkingService.update(editing.Uuid, payload)
        : await adminTimeWorkingService.create(payload);
      const saved = response.data ?? response.Data;
      if (!saved) throw new Error("API không trả về khung giờ đã lưu");
      const mapped = mapTimeWorking(saved);
      setWorkings((current) => (editing
        ? current.map((item) => item.Uuid === mapped.Uuid ? mapped : item)
        : [...current, mapped]).sort(compareTimeWorking));
      setEditing(null);
    } catch (requestError) {
      console.error("Không thể lưu khung giờ:", requestError);
      setError("Không thể lưu khung giờ. Khung giờ có thể đã tồn tại hoặc giờ kết thúc không hợp lệ.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleDeleted(working: TimeWorking) {
    if (submitting) return;
    const deleted = working.DeletedAt.getTime() === 0;
    if (!window.confirm(`${deleted ? "Xóa" : "Khôi phục"} khung giờ này?`)) return;

    setSubmitting(true);
    setError(null);
    try {
      if (deleted) await adminTimeWorkingService.delete(working.Uuid);
      else await adminTimeWorkingService.restore(working.Uuid);
      const now = new Date();
      setWorkings((current) => current.map((item) => item.Uuid === working.Uuid
        ? { ...item, DeletedAt: deleted ? now : new Date(0), UpdatedAt: now }
        : item));
    } catch (requestError) {
      console.error("Không thể thay đổi khung giờ:", requestError);
      setError(`Không thể ${deleted ? "xóa" : "khôi phục"} khung giờ.`);
    } finally {
      setSubmitting(false);
    }
  }

  const visibleWorkings = workings.filter((working) => visibility === "deleted" ? working.DeletedAt.getTime() > 0 : working.DeletedAt.getTime() === 0);
  const rows = visibleWorkings.map((working) => [
    dayNames[working.DayOfWeek],
    working.StartTime,
    working.EndTime,
    working.DeletedAt.getTime() > 0 ? <StatusPill key={`${working.Uuid}-status`} tone="red">Đã xóa</StatusPill> : <StatusPill key={`${working.Uuid}-status`} tone="green">Hoạt động</StatusPill>,
    <div key={`${working.Uuid}-actions`} className="flex gap-1">
      {working.DeletedAt.getTime() === 0 ? <Button type="button" size="icon-sm" variant="ghost" disabled={submitting} aria-label="Sửa khung giờ" onClick={() => setEditing(working)}><Pencil /></Button> : null}
      <Button type="button" size="sm" disabled={submitting} variant={working.DeletedAt.getTime() > 0 ? "outline" : "destructive"} onClick={() => void toggleDeleted(working)}>{working.DeletedAt.getTime() > 0 ? <><RotateCcw />Khôi phục</> : <><Trash2 />Xóa</>}</Button>
    </div>,
  ]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <PortalPageHeader eyebrow="Danh mục lịch dùng chung" title="Khung giờ làm việc" description="Tạo các khung giờ chuẩn để gán cho bác sĩ, bệnh viện và dịch vụ."/>
      {error ? <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <PortalSection title="Danh sách khung giờ" description={`${workings.length} khung giờ đang hoạt động`}>
        <div className="flex justify-end border-b p-4"><select value={visibility} onChange={(event) => setVisibility(event.target.value as "current" | "deleted")} className="h-9 rounded-md border bg-white px-3 text-sm"><option value="current">Khung giờ hiện hành</option><option value="deleted">Đã xóa</option></select></div>
        <PortalTable caption="Danh sách khung giờ làm việc" columns={["Ngày", "Bắt đầu", "Kết thúc", "Trạng thái", "Thao tác"]} rows={rows} />
      </PortalSection>
      <ScheduleForm
        key={editing?.Uuid ?? "create-time-working"}
        title={editing ? "Chỉnh sửa khung giờ" : "Tạo khung giờ mới"}
        submitLabel={editing ? "Lưu thay đổi" : "Lưu khung giờ"}
        initialValue={editing ? {
          dayOfWeek: editing.DayOfWeek,
          startTime: editing.StartTime,
          endTime: editing.EndTime,
        } : undefined}
        submitting={submitting}
        onCancel={editing ? () => setEditing(null) : undefined}
        onSubmit={(value) => void saveWorking(value)}
      />
    </div>
  );
}

function mapTimeWorking(item: AdminTimeWorkingItem): TimeWorking {
  return {
    Uuid: item.uuid,
    DayOfWeek: item.dayOfWeek,
    StartTime: item.startTime.slice(0, 5),
    EndTime: item.endTime.slice(0, 5),
    Status: item.status,
    CreatedAt: new Date(item.createdAt),
    UpdatedAt: new Date(item.updatedAt),
    DeletedAt: item.deletedAt ? new Date(item.deletedAt) : new Date(0),
  };
}

function compareTimeWorking(left: TimeWorking, right: TimeWorking) {
  return left.DayOfWeek - right.DayOfWeek || left.StartTime.localeCompare(right.StartTime);
}

export function DoctorWorkingScreen() {
  return (
    <AssignmentScreen
      eyebrow="Lịch cá nhân"
      title="Giờ làm việc của bác sĩ"
      description="Xem lịch đang áp dụng và gửi yêu cầu thay đổi để đơn vị quản lý phê duyệt."
      assignmentCount={mockDoctorWorkings.length}
      request
    />
  );
}

export function HospitalWorkingScreen() {
  return (
    <AssignmentScreen
      eyebrow="Lịch hoạt động cơ sở"
      title="Giờ làm việc bệnh viện"
      description="Cấu hình khung giờ tiếp nhận và gửi thay đổi lịch hoạt động để phê duyệt."
      assignmentCount={mockHospitalWorkings.length}
      admin
    />
  );
}

export function ServiceWorkingScreen() {
  return (
    <AssignmentScreen
      eyebrow="Lịch cung cấp dịch vụ"
      title="Giờ làm việc dịch vụ"
      description="Gán khung giờ thực hiện cho từng dịch vụ và gửi thay đổi lịch."
      assignmentCount={mockServiceWorkings.length}
    />
  );
}

type WorkingRequest = {
  code: string;
  doctor: string;
  date: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
};

type Schedule = { id: string; dayOfWeek: number; startTime: string; endTime: string; source: string };

const initialRequests: WorkingRequest[] = [
  { code: "WHR-2609-014", doctor: "BS. Nguyễn Hoàng Minh", date: "26/09/2026", dayOfWeek: 5, startTime: "07:00", endTime: "11:30", reason: "Điều chỉnh lịch trực chiều", status: "pending" },
  { code: "WHR-2609-012", doctor: "BS. Phạm Ngọc Anh", date: "25/09/2026", dayOfWeek: 6, startTime: "08:00", endTime: "12:00", reason: "Bổ sung ca khám cuối tuần", status: "pending" },
  { code: "WHR-2608-008", doctor: "BS. Trần Thanh Vũ", date: "18/08/2026", dayOfWeek: 2, startTime: "13:00", endTime: "17:00", reason: "Bổ sung ca chiều", status: "approved" },
];

function AssignmentScreen({ eyebrow, title, description, assignmentCount, request = false, admin = false }: { eyebrow: string; title: string; description: string; assignmentCount: number; request?: boolean; admin?: boolean }) {
  const [requests, setRequests] = useState<WorkingRequest[]>(initialRequests);
  const [schedules, setSchedules] = useState<Schedule[]>(() => mockTimeWorkings.slice(0, 6).map((working) => ({
    id: working.Uuid,
    dayOfWeek: working.DayOfWeek,
    startTime: working.StartTime,
    endTime: working.EndTime,
    source: "Lịch hiện tại",
  })));
  const rows = schedules.map((working) => [
    dayNames[working.dayOfWeek],
    `${working.startTime} - ${working.endTime}`,
    working.source,
    <StatusPill key={working.id} tone="green">Đang áp dụng</StatusPill>,
  ]);

  function addSchedule(value: ScheduleFormValue, source: string) {
    setSchedules((current) => [...current, { id: crypto.randomUUID(), ...value, source }]);
  }

  function reviewRequest(code: string, status: "approved" | "rejected") {
    const selected = requests.find((item) => item.code === code);
    setRequests((current) => current.map((item) => item.code === code ? { ...item, status } : item));
    if (selected && status === "approved") {
      addSchedule(selected, `Duyệt từ ${selected.code}`);
    }
  }

  return (
    <div className="space-y-6">
      <PortalPageHeader eyebrow={eyebrow} title={title} description={description} actions={request ? <PortalAction variant="default"><FilePenLine />Tạo yêu cầu thay đổi</PortalAction> : admin ? <StatusPill tone="blue">HOSPITAL_ADMIN</StatusPill> : undefined} />
      <PortalSection title="Lịch hiện tại" description={`${assignmentCount} lượt gán khung giờ trong dữ liệu mẫu`}>
        <PortalTable caption={title} columns={["Ngày", "Khung giờ", "Nguồn", "Trạng thái"]} rows={rows} />
      </PortalSection>
      {request ? (
        <>
          <ScheduleForm
            title="Đơn đề nghị thay đổi giờ làm việc"
            submitLabel="Gửi đơn thay đổi"
            showReason
            onSubmit={({ dayOfWeek, startTime, endTime, reason }) => setRequests((current) => [{
              code: `WHR-${Date.now().toString().slice(-6)}`,
              doctor: "BS. Nguyễn Hoàng Minh",
              date: new Intl.DateTimeFormat("vi-VN").format(new Date()),
              dayOfWeek,
              startTime,
              endTime,
              reason,
              status: "pending",
            }, ...current])}
          />
          <PortalSection title="Yêu cầu gần đây">
            <PortalTable caption="Yêu cầu thay đổi giờ làm việc" columns={["Mã đơn", "Ngày gửi", "Khung giờ", "Lý do", "Trạng thái"]} rows={requests.filter((item) => item.doctor === "BS. Nguyễn Hoàng Minh").map((item) => [item.code, item.date, `${dayNames[item.dayOfWeek]}, ${item.startTime} - ${item.endTime}`, item.reason, requestStatus(item)])} />
          </PortalSection>
        </>
      ) : null}
      {admin ? (
        <>
          <PortalSection title="Hàng chờ phê duyệt" description={`${requests.filter((item) => item.status === "pending").length} yêu cầu của bác sĩ đang chờ xử lý`}>
            <PortalTable caption="Hàng chờ phê duyệt giờ làm việc" columns={["Mã đơn", "Bác sĩ", "Khung giờ đề nghị", "Lý do", "Trạng thái", "Thao tác"]} rows={requests.map((item) => [
              item.code,
              <div key={`${item.code}-doctor`}><p>{item.doctor}</p><p className="mt-1 text-xs font-normal text-muted-foreground">Gửi {item.date}</p></div>,
              `${dayNames[item.dayOfWeek]}, ${item.startTime} - ${item.endTime}`,
              item.reason,
              requestStatus(item),
              item.status === "pending" ? <div key={`${item.code}-actions`} className="flex gap-2"><Button type="button" size="sm" onClick={() => reviewRequest(item.code, "approved")}><Check />Duyệt</Button><Button type="button" size="sm" variant="outline" onClick={() => reviewRequest(item.code, "rejected")}><X />Từ chối</Button></div> : <span key={`${item.code}-reviewed`} className="text-xs text-muted-foreground">Đã xử lý</span>,
            ])} />
          </PortalSection>
          <ScheduleForm title="Thêm giờ làm việc trực tiếp cho bác sĩ" submitLabel="Thêm vào lịch bác sĩ" showDoctor onSubmit={(value) => addSchedule(value, `Quản trị viên thêm cho ${value.doctor}`)} />
        </>
      ) : null}
      {!request && !admin ? <ScheduleForm title="Cập nhật giờ làm việc" submitLabel="Gửi thay đổi" showReason onSubmit={(value) => addSchedule(value, "Thay đổi được gửi")} /> : null}
    </div>
  );
}

function requestStatus(request: WorkingRequest) {
  if (request.status === "approved") return <StatusPill key={request.code} tone="green">Đã duyệt</StatusPill>;
  if (request.status === "rejected") return <StatusPill key={request.code} tone="red">Đã từ chối</StatusPill>;
  return <StatusPill key={request.code} tone="amber">Chờ duyệt</StatusPill>;
}

type ScheduleFormValue = { dayOfWeek: number; startTime: string; endTime: string; reason: string; doctor: string };

function ScheduleForm({
  title,
  submitLabel,
  showReason = false,
  showDoctor = false,
  initialValue,
  submitting = false,
  onCancel,
  onSubmit,
}: {
  title: string;
  submitLabel: string;
  showReason?: boolean;
  showDoctor?: boolean;
  initialValue?: Partial<ScheduleFormValue>;
  submitting?: boolean;
  onCancel?: () => void;
  onSubmit: (value: ScheduleFormValue) => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit({
      dayOfWeek: Number(data.get("dayOfWeek")),
      startTime: String(data.get("startTime")),
      endTime: String(data.get("endTime")),
      reason: String(data.get("reason") ?? ""),
      doctor: String(data.get("doctor") ?? "bác sĩ được chọn"),
    });
    event.currentTarget.reset();
  }

  return (
    <PortalSection title={title} action={<CalendarClock className="size-5 text-primary" />}>
      <form onSubmit={handleSubmit} className="grid gap-5 p-5 sm:grid-cols-3">
        {showDoctor ? <div className="space-y-2 sm:col-span-3"><Label htmlFor={`${title}-doctor`}>Bác sĩ</Label><select id={`${title}-doctor`} name="doctor" className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option>BS. Nguyễn Hoàng Minh</option><option>BS. Phạm Ngọc Anh</option><option>BS. Trần Thanh Vũ</option></select></div> : null}
        <div className="space-y-2"><Label htmlFor={`${title}-day`}>Ngày trong tuần</Label><select id={`${title}-day`} name="dayOfWeek" defaultValue={initialValue?.dayOfWeek ?? 1} className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="0">Chủ Nhật</option><option value="1">Thứ Hai</option><option value="2">Thứ Ba</option><option value="3">Thứ Tư</option><option value="4">Thứ Năm</option><option value="5">Thứ Sáu</option><option value="6">Thứ Bảy</option></select></div>
        <div className="space-y-2"><Label htmlFor={`${title}-start`}>Bắt đầu</Label><Input id={`${title}-start`} name="startTime" type="time" defaultValue={initialValue?.startTime ?? "07:00"} required /></div>
        <div className="space-y-2"><Label htmlFor={`${title}-end`}>Kết thúc</Label><Input id={`${title}-end`} name="endTime" type="time" defaultValue={initialValue?.endTime ?? "11:30"} required /></div>
        {showReason ? <div className="space-y-2 sm:col-span-3"><Label htmlFor={`${title}-reason`}>Lý do thay đổi</Label><Textarea id={`${title}-reason`} name="reason" rows={3} placeholder="Mô tả lý do và thời gian muốn áp dụng" required /></div> : null}
        <div className="flex gap-2 sm:col-span-3">{onCancel ? <Button type="button" variant="outline" disabled={submitting} onClick={onCancel}>Hủy</Button> : null}<Button type="submit" disabled={submitting}><Send />{submitting ? "Đang lưu..." : submitLabel}</Button></div>
      </form>
    </PortalSection>
  );
}
