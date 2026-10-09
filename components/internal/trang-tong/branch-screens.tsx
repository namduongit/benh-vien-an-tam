"use client";

import {
  Activity,
  BedDouble,
  CalendarCheck2,
  CircleDollarSign,
  ClipboardCheck,
  PackageCheck,
  Pencil,
  Plus,
  RotateCcw,
  ShieldAlert,
  Star,
  Stethoscope,
  Trash2,
  UsersRound,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { isAxiosError } from "axios";

import { ErrorState, LoadingState } from "@/components/shared/data-state";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { HospitalWorkingScreen } from "@/components/internal/trang-tong/working-hours-screens";
import { mockHospitals } from "@/data/mocks/hospitals";
import { markdownToPlainText } from "@/lib/format";
import {
  hospitalService,
  type HospitalUpdateRequest,
} from "@/lib/services/hospital/HospitalService";
import { departmentService } from "@/lib/services/department/DepartmentService";
import { medicalServiceService } from "@/lib/services/medical-service/MedicalServiceService";
import { mockRooms } from "@/data/mocks/rooms";
import {
  BaseStatus,
  RoomStatus,
  type Department,
  type Hospital,
  type HospitalAssignmentSelection,
  type MedicalService,
  type Room,
} from "@/types/models";

export function BranchScreens({ slug }: { slug: string }) {
  switch (slug) {
    case "tong-quan": return <HospitalDashboard />;
    case "thong-tin-chi-nhanh": return <HospitalProfileScreen />;
    case "chuyen-khoa-dich-vu": return <AssignmentsScreen />;
    case "phong-kham": return <RoomsScreen />;
    case "nhan-su": return <StaffAccountsScreen />;
    case "lich-hen": return <HospitalAppointmentsScreen />;
    case "don-thuoc": return <HospitalPrescriptionsScreen />;
    case "kho-thuoc": return <HospitalInventoryScreen />;
    case "danh-gia": return <HospitalReviewsScreen />;
    case "bao-cao": return <HospitalReportsScreen />;
    case "nhat-ky": return <HospitalAuditScreen />;
    case "gio-lam-viec-benh-vien": return <HospitalWorkingScreen />;
    default: return null;
  }
}

function HospitalDashboard() {
  return (
    <div className="space-y-6">
      <PortalPageHeader eyebrow="BV Đa khoa Thành Phố" title="Trung tâm điều hành chi nhánh" description="Tình hình tiếp nhận, phòng khám và công việc cần phê duyệt trong hôm nay." actions={<><PortalAction>Xem lịch trực</PortalAction><PortalAction variant="default">Tạo lịch hẹn</PortalAction></>} />
      <MetricGrid>
        <MetricCard label="Lịch hôm nay" value="148" detail="18 lịch đang chờ xác nhận" icon={<CalendarCheck2 className="size-5" />} />
        <MetricCard label="Đã check-in" value="92" detail="62,2% tổng lịch hôm nay" trend="up" icon={<ClipboardCheck className="size-5" />} tone="green" />
        <MetricCard label="Phòng đang sử dụng" value="16/24" detail="4 phòng đang bảo trì" icon={<BedDouble className="size-5" />} tone="cyan" />
        <MetricCard label="Phiếu chờ duyệt" value="7" detail="5 nhập kho, 2 xuất kho" icon={<PackageCheck className="size-5" />} tone="amber" />
      </MetricGrid>
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <PortalSection title="Nhịp tiếp nhận hôm nay" description="Số lượt theo khung giờ"><ProgressList items={[
          { label: "07:00 - 09:00", value: 88, display: "42 lượt" },
          { label: "09:00 - 11:00", value: 72, display: "35 lượt", color: "bg-cyan-500" },
          { label: "13:00 - 15:00", value: 58, display: "28 lượt", color: "bg-emerald-500" },
          { label: "15:00 - 17:00", value: 41, display: "20 lượt", color: "bg-amber-500" },
        ]} /></PortalSection>
        <PortalSection title="Việc cần xử lý">
          <div className="divide-y p-5 pt-2">
            {[
              ["18 lịch chờ xác nhận", "Lịch hẹn", "amber"],
              ["7 phiếu kho chờ duyệt", "Kho thuốc", "blue"],
              ["12 đánh giá chưa xem", "Đánh giá", "purple"],
              ["4 phòng đang bảo trì", "Phòng khám", "red"],
            ].map(([label, category, tone]) => (
              <div key={label} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span className="font-medium">{label}</span>
                <StatusPill tone={tone as "amber" | "blue" | "purple" | "red"}>{category}</StatusPill>
              </div>
            ))}
          </div>
        </PortalSection>
      </div>
      <PortalSection title="Lịch sắp diễn ra">
        <PortalTable caption="Lịch khám sắp diễn ra" columns={["Giờ", "Bệnh nhân", "Loại lịch", "Bác sĩ / phòng", "Trạng thái"]} rows={appointmentRows.slice(0, 4)} />
      </PortalSection>
    </div>
  );
}

function HospitalProfileScreen() {
  const [attempt, setAttempt] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [state, setState] = useState<
    | { status: "loading" }
    | {
        status: "success";
        hospital: Hospital;
        draft: HospitalProfileDraft;
        savedMessage?: string;
        saveError?: string;
      }
    | { status: "error"; message: string }
  >({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setState({ status: "loading" });
    hospitalService
      .getBranchProfile(controller.signal)
      .then((response) => {
        if (active) {
          setState({
            status: "success",
            hospital: response.Data,
            draft: toHospitalProfileDraft(response.Data),
          });
        }
      })
      .catch(() => {
        if (active) {
          setState({
            status: "error",
            message: "Không thể tải thông tin chi nhánh. Vui lòng thử lại.",
          });
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt]);

  if (state.status === "loading") {
    return <LoadingState label="Đang tải thông tin chi nhánh" />;
  }

  if (state.status === "error") {
    return (
      <ErrorState
        message={state.message}
        onRetry={() => setAttempt((current) => current + 1)}
      />
    );
  }

  const { hospital, draft } = state;
  const isActive = hospital.Status === BaseStatus.Active;

  function updateDraft<K extends keyof HospitalProfileDraft>(
    key: K,
    value: HospitalProfileDraft[K],
  ) {
    setState((current) =>
      current.status === "success"
        ? {
            ...current,
            draft: { ...current.draft, [key]: value },
            savedMessage: undefined,
            saveError: undefined,
          }
        : current,
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.status !== "success") return;

    setIsSaving(true);
    setState((current) =>
      current.status === "success"
        ? { ...current, savedMessage: undefined, saveError: undefined }
        : current,
    );

    const request: HospitalUpdateRequest = {
      Image: hospital.Image,
      MapUrl: hospital.MapUrl,
      Slug: draft.Slug.trim(),
      Name: draft.Name.trim(),
      Address: draft.Address.trim(),
      NumberOfRoom: Number(draft.NumberOfRoom),
      Description: draft.Description.trim(),
      DetailService: hospital.DetailService,
      WorkingHour: draft.WorkingHour.trim(),
    };

    try {
      const response = await hospitalService.updateBranchProfile(
        hospital.Uuid,
        request,
      );
      setState({
        status: "success",
        hospital: response.Data,
        draft: toHospitalProfileDraft(response.Data),
        savedMessage: response.Message,
      });
    } catch (error) {
      setState((current) =>
        current.status === "success"
          ? { ...current, saveError: getHospitalSaveError(error) }
          : current,
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      id="hospital-profile-form"
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <PortalPageHeader
        eyebrow="Thiết lập chi nhánh"
        title="Thông tin chi nhánh"
        description="Cập nhật thông tin công khai của chi nhánh."
        actions={
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <PortalSection title="Thông tin hiển thị">
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <Field
              label="Tên cơ sở"
              value={draft.Name}
              onChange={(value) => updateDraft("Name", value)}
              required
              disabled={isSaving}
            />
            <Field
              label="Slug"
              value={draft.Slug}
              onChange={(value) => updateDraft("Slug", value)}
              required
              disabled={isSaving}
            />
            <div className="sm:col-span-2">
              <Field
                label="Địa chỉ"
                value={draft.Address}
                onChange={(value) => updateDraft("Address", value)}
                required
                disabled={isSaving}
              />
            </div>
            <Field
              label="Giờ làm việc"
              value={draft.WorkingHour}
              onChange={(value) => updateDraft("WorkingHour", value)}
              required
              disabled={isSaving}
            />
            <Field
              label="Số phòng"
              value={draft.NumberOfRoom}
              onChange={(value) => updateDraft("NumberOfRoom", value)}
              type="number"
              min="1"
              step="1"
              required
              disabled={isSaving}
            />
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="hospital-description">Mô tả</Label>
              <Textarea
                id="hospital-description"
                rows={6}
                value={draft.Description}
                onChange={(event) =>
                  updateDraft("Description", event.currentTarget.value)
                }
                disabled={isSaving}
              />
            </div>
            {state.savedMessage ? (
              <p
                role="status"
                className="text-sm font-medium text-emerald-700 sm:col-span-2"
              >
                {state.savedMessage}
              </p>
            ) : null}
            {state.saveError ? (
              <p
                role="alert"
                className="text-sm font-medium text-destructive sm:col-span-2"
              >
                {state.saveError}
              </p>
            ) : null}
          </div>
        </PortalSection>
        <PortalSection title="Trạng thái xuất bản">
          <DetailGrid>
            <DetailItem label="Trạng thái" value={<StatusPill tone={isActive ? "green" : "amber"}>{isActive ? "Hoạt động" : "Tạm ngưng"}</StatusPill>} />
            <DetailItem label="UUID cơ sở" value={<span className="break-all font-mono text-xs">{hospital.Uuid}</span>} />
            <DetailItem label="Cập nhật cuối" value={formatHospitalDate(hospital.UpdatedAt)} />
          </DetailGrid>
        </PortalSection>
      </div>
    </form>
  );
}

function AssignmentsScreen() {
  const [attempt, setAttempt] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error"; message: string }
    | {
        status: "success";
        hospital: Hospital;
        departments: Department[];
        services: MedicalService[];
        assigned: HospitalAssignmentSelection;
        selected: HospitalAssignmentSelection;
        savedMessage?: string;
        saveError?: string;
      }
  >({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    if (process.env.NEXT_PUBLIC_USE_MOCK_API === "false") {
      setState({
        status: "error",
        message:
          "Màn hình này hiện chỉ hỗ trợ mock API. Hãy bật NEXT_PUBLIC_USE_MOCK_API để tiếp tục.",
      });

      return () => {
        active = false;
        controller.abort();
      };
    }

    setState({ status: "loading" });
    hospitalService
      .getBranchProfile(controller.signal)
      .then(async (hospitalResponse) => {
        const hospital = hospitalResponse.Data;
        const [
          departmentResponse,
          serviceResponse,
          assignedDepartmentResponse,
          assignedServiceResponse,
        ] = await Promise.all([
          departmentService.getAll(
            { page: 1, pageSize: 100 },
            controller.signal,
          ),
          medicalServiceService.getAll(
            { page: 1, pageSize: 100 },
            controller.signal,
          ),
          hospitalService.getAssignedDepartments(
            hospital.Uuid,
            controller.signal,
          ),
          hospitalService.getAssignedMedicalServices(
            hospital.Uuid,
            controller.signal,
          ),
        ]);

        if (!active) return;

        const assigned = {
          DepartmentUuids: assignedDepartmentResponse.Data.Items.map(
            (department) => department.Uuid,
          ),
          MedicalServiceUuids: assignedServiceResponse.Data.Items.map(
            (service) => service.Uuid,
          ),
        };
        setState({
          status: "success",
          hospital,
          departments: departmentResponse.Data.Items,
          services: serviceResponse.Data.Items,
          assigned,
          selected: {
            DepartmentUuids: [...assigned.DepartmentUuids],
            MedicalServiceUuids: [...assigned.MedicalServiceUuids],
          },
        });
      })
      .catch(() => {
        if (active) {
          setState({
            status: "error",
            message: "Không thể tải chuyên khoa và dịch vụ. Vui lòng thử lại.",
          });
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt]);

  if (state.status === "loading") {
    return <LoadingState label="Đang tải chuyên khoa và dịch vụ chi nhánh" />;
  }

  if (state.status === "error") {
    return (
      <ErrorState
        message={state.message}
        onRetry={() => setAttempt((current) => current + 1)}
      />
    );
  }

  const hasChanges =
    !sameUuidSelection(
      state.assigned.DepartmentUuids,
      state.selected.DepartmentUuids,
    ) ||
    !sameUuidSelection(
      state.assigned.MedicalServiceUuids,
      state.selected.MedicalServiceUuids,
    );

  function toggleAssignment(
    key: keyof HospitalAssignmentSelection,
    uuid: string,
  ) {
    setState((current) => {
      if (current.status !== "success") return current;
      const selected = new Set(current.selected[key]);
      if (selected.has(uuid)) selected.delete(uuid);
      else selected.add(uuid);

      return {
        ...current,
        selected: { ...current.selected, [key]: [...selected] },
        savedMessage: undefined,
        saveError: undefined,
      };
    });
  }

  function resetChanges() {
    setState((current) =>
      current.status === "success"
        ? {
            ...current,
            selected: {
              DepartmentUuids: [...current.assigned.DepartmentUuids],
              MedicalServiceUuids: [...current.assigned.MedicalServiceUuids],
            },
            savedMessage: undefined,
            saveError: undefined,
          }
        : current,
    );
  }

  async function saveAssignments() {
    if (state.status !== "success" || !hasChanges) return;
    setIsSaving(true);
    setState((current) =>
      current.status === "success"
        ? { ...current, savedMessage: undefined, saveError: undefined }
        : current,
    );

    try {
      const response = await hospitalService.updateAssignments(
        state.hospital.Uuid,
        state.selected,
      );
      setState((current) =>
        current.status === "success"
          ? {
              ...current,
              assigned: response.Data,
              selected: {
                DepartmentUuids: [...response.Data.DepartmentUuids],
                MedicalServiceUuids: [...response.Data.MedicalServiceUuids],
              },
              savedMessage: response.Message,
            }
          : current,
      );
    } catch (error) {
      setState((current) =>
        current.status === "success"
          ? {
              ...current,
              saveError: getHospitalSaveError(
                error,
                "Không thể lưu phân bổ. Vui lòng thử lại.",
              ),
            }
          : current,
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PortalPageHeader
        eyebrow={`Phân bổ danh mục · ${state.hospital.Name}`}
        title="Chuyên khoa và dịch vụ"
        description="Chọn danh mục đang được cung cấp tại chi nhánh. Thay đổi hiện được lưu bằng mock trong trình duyệt, chưa gửi tới backend."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              disabled={!hasChanges || isSaving}
              onClick={resetChanges}
            >
              Hủy thay đổi
            </Button>
            <Button
              type="button"
              disabled={!hasChanges || isSaving}
              onClick={saveAssignments}
            >
              {isSaving ? "Đang lưu..." : "Lưu phân bổ"}
            </Button>
          </>
        }
      />
      {state.savedMessage ? (
        <p
          role="status"
          className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          {state.savedMessage}
        </p>
      ) : null}
      {state.saveError ? (
        <p
          role="alert"
          className="border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {state.saveError}
        </p>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <AssignmentList
          title="Chuyên khoa"
          items={state.departments}
          selectedUuids={state.selected.DepartmentUuids}
          disabled={isSaving}
          onToggle={(uuid) => toggleAssignment("DepartmentUuids", uuid)}
        />
        <AssignmentList
          title="Dịch vụ"
          items={state.services}
          selectedUuids={state.selected.MedicalServiceUuids}
          disabled={isSaving}
          onToggle={(uuid) => toggleAssignment("MedicalServiceUuids", uuid)}
        />
      </div>
    </div>
  );
}

function AssignmentList({
  title,
  items,
  selectedUuids,
  disabled,
  onToggle,
}: {
  title: string;
  items: Array<{ Uuid: string; Name: string; Description: string }>;
  selectedUuids: string[];
  disabled: boolean;
  onToggle: (uuid: string) => void;
}) {
  const [query, setQuery] = useState("");
  const filteredItems = items.filter((item) =>
    `${item.Name} ${item.Description}`
      .toLocaleLowerCase("vi")
      .includes(query.trim().toLocaleLowerCase("vi")),
  );

  return (
    <PortalSection
      title={title}
      description={`${selectedUuids.length}/${items.length} đang áp dụng`}
    >
      <div className="border-b p-4">
        <label className="block">
          <span className="sr-only">Tìm {title.toLocaleLowerCase("vi")}</span>
          <Input
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder={`Tìm ${title.toLocaleLowerCase("vi")}`}
            className="h-9"
          />
        </label>
      </div>
      {filteredItems.length > 0 ? (
        <div className="divide-y">
          {filteredItems.map((item) => {
            const isSelected = selectedUuids.includes(item.Uuid);
            return (
              <label
                key={item.Uuid}
                className="flex cursor-pointer items-start justify-between gap-4 px-5 py-4 hover:bg-muted/35"
              >
                <span className="flex min-w-0 items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={disabled}
                    onChange={() => onToggle(item.Uuid)}
                    className="mt-1 size-4 shrink-0 accent-primary"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{item.Name}</span>
                    <span className="mt-1 line-clamp-2 block text-xs leading-5 text-muted-foreground">
                      {markdownToPlainText(item.Description)}
                    </span>
                  </span>
                </span>
                <StatusPill
                  tone={isSelected ? "green" : "neutral"}
                  className="shrink-0 whitespace-nowrap"
                >
                  {isSelected ? "Đang áp dụng" : "Chưa áp dụng"}
                </StatusPill>
              </label>
            );
          })}
        </div>
      ) : (
        <p className="p-8 text-center text-sm text-muted-foreground">
          Không tìm thấy {title.toLocaleLowerCase("vi")} phù hợp.
        </p>
      )}
    </PortalSection>
  );
}

function sameUuidSelection(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((uuid) => right.includes(uuid))
  );
}

function RoomsScreen() {
  const hospital = mockHospitals[0];
  const [rooms, setRooms] = useState<Room[]>(() => mockRooms.filter((room) => room.HospitalUuid === hospital.Uuid));
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const activeRooms = rooms.filter((room) => room.DeletedAt.getTime() === 0);
  const deletedRooms = rooms.length - activeRooms.length;
  const availableRooms = activeRooms.filter((room) => room.Status === RoomStatus.Available).length;
  const occupiedRooms = activeRooms.filter((room) => room.Status === RoomStatus.Occupied).length;
  const maintenanceRooms = activeRooms.filter((room) => room.Status === RoomStatus.Maintenance).length;
  const atCapacity = activeRooms.length >= hospital.NumberOfRoom;

  function openCreateForm() {
    setEditingRoom(null);
    setShowForm(true);
    setMessage(atCapacity ? `Đã đạt giới hạn ${hospital.NumberOfRoom} phòng. Xóa một phòng trước khi thêm mới.` : "");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name")).trim();
    const status = String(data.get("status")) as RoomStatus;

    if (!editingRoom && atCapacity) {
      setMessage(`Không thể thêm: ${hospital.Name} chỉ được cấu hình tối đa ${hospital.NumberOfRoom} phòng.`);
      return;
    }

    const now = new Date();
    if (editingRoom) {
      setRooms((current) => current.map((room) => room.Uuid === editingRoom.Uuid ? { ...room, Name: name, Status: status, UpdatedAt: now } : room));
      setMessage(`Đã cập nhật ${name}.`);
    } else {
      setRooms((current) => [...current, {
        Uuid: crypto.randomUUID(),
        Name: name,
        Status: status,
        HospitalUuid: hospital.Uuid,
        CreatedAt: now,
        UpdatedAt: now,
        DeletedAt: new Date(0),
      }]);
      setMessage(`Đã thêm ${name}.`);
    }
    setEditingRoom(null);
    setShowForm(false);
  }

  function softDelete(room: Room) {
    setRooms((current) => current.map((item) => item.Uuid === room.Uuid ? { ...item, DeletedAt: new Date(), UpdatedAt: new Date() } : item));
    setMessage(`Đã xóa ${room.Name}. Có thể khôi phục từ danh sách.`);
    if (editingRoom?.Uuid === room.Uuid) setShowForm(false);
  }

  function restore(room: Room) {
    if (atCapacity) {
      setMessage(`Không thể khôi phục: đã dùng đủ ${hospital.NumberOfRoom}/${hospital.NumberOfRoom} phòng.`);
      return;
    }
    setRooms((current) => current.map((item) => item.Uuid === room.Uuid ? { ...item, DeletedAt: new Date(0), UpdatedAt: new Date() } : item));
    setMessage(`Đã khôi phục ${room.Name}.`);
  }

  const roomRows = rooms.map((room) => {
    const isDeleted = room.DeletedAt.getTime() !== 0;
    const status = room.Status === RoomStatus.Available
      ? <StatusPill tone="green">Khả dụng</StatusPill>
      : room.Status === RoomStatus.Occupied
        ? <StatusPill tone="blue">Đang sử dụng</StatusPill>
        : <StatusPill tone="amber">Bảo trì</StatusPill>;
    return [
      <div key={`${room.Uuid}-name`}><p>{room.Name}</p><p className="mt-1 font-mono text-xs font-normal text-muted-foreground">{room.Uuid.slice(0, 8)}</p></div>,
      status,
      <StatusPill key={`${room.Uuid}-record`} tone={isDeleted ? "red" : "green"}>{isDeleted ? "Đã xóa" : "Đang quản lý"}</StatusPill>,
      new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(room.UpdatedAt),
      <div key={`${room.Uuid}-actions`} className="flex gap-2">
        {isDeleted ? (
          <Button type="button" size="sm" variant="outline" onClick={() => restore(room)} disabled={atCapacity}><RotateCcw />Khôi phục</Button>
        ) : (
          <>
            <Button type="button" size="sm" variant="outline" onClick={() => { setEditingRoom(room); setShowForm(true); setMessage(""); }}><Pencil />Sửa</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => softDelete(room)}><Trash2 />Xóa</Button>
          </>
        )}
      </div>,
    ];
  });

  return (
    <div className="space-y-6">
      <PortalPageHeader eyebrow="Vận hành cơ sở" title="Phòng khám" description={`Quản lý phòng của ${hospital.Name}; giới hạn lấy từ cấu hình Hospital.NumberOfRoom.`} actions={<Button type="button" size="sm" onClick={openCreateForm} disabled={atCapacity}><Plus />Thêm phòng</Button>} />
      <MetricGrid>
        <MetricCard label="Công suất cấu hình" value={`${activeRooms.length}/${hospital.NumberOfRoom}`} detail={atCapacity ? "Đã đạt giới hạn, không thể thêm phòng" : `Còn ${hospital.NumberOfRoom - activeRooms.length} vị trí phòng`} icon={<BedDouble className="size-5" />} tone={atCapacity ? "red" : "blue"} />
        <MetricCard label="Khả dụng" value={String(availableRooms)} detail="Sẵn sàng tiếp nhận" icon={<ClipboardCheck className="size-5" />} tone="green" />
        <MetricCard label="Đang sử dụng" value={String(occupiedRooms)} detail={`${maintenanceRooms} phòng đang bảo trì`} icon={<Activity className="size-5" />} tone="cyan" />
        <MetricCard label="Đã xóa" value={String(deletedRooms)} detail="Không tính vào giới hạn phòng" icon={<Trash2 className="size-5" />} tone="amber" />
      </MetricGrid>
      <PortalSection title="Sức chứa phòng" description={`${activeRooms.length} phòng đang quản lý trên tối đa ${hospital.NumberOfRoom} phòng`}>
        <div className="p-5">
          <div className="mb-2 flex items-center justify-between gap-4 text-sm"><span className="font-medium">Mức sử dụng cấu hình</span><span className={atCapacity ? "font-semibold text-red-600" : "text-muted-foreground"}>{Math.round((activeRooms.length / hospital.NumberOfRoom) * 100)}%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${atCapacity ? "bg-red-500" : "bg-primary"}`} style={{ width: `${Math.min((activeRooms.length / hospital.NumberOfRoom) * 100, 100)}%` }} /></div>
          <p className="mt-3 text-xs text-muted-foreground">Phòng đã xóa vẫn được lưu trong bảng để kiểm tra và khôi phục, nhưng không chiếm sức chứa.</p>
        </div>
      </PortalSection>
      {showForm ? (
        <PortalSection title={editingRoom ? `Chỉnh sửa ${editingRoom.Name}` : "Thêm phòng mới"} description={editingRoom ? "Cập nhật tên và trạng thái vận hành." : `Còn ${Math.max(hospital.NumberOfRoom - activeRooms.length, 0)} vị trí có thể tạo.`}>
          <form onSubmit={handleSubmit} className="grid gap-5 p-5 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="room-name">Tên phòng</Label><Input id="room-name" name="name" defaultValue={editingRoom?.Name ?? ""} placeholder="Ví dụ: Phòng khám A2" required /></div>
            <div className="space-y-2"><Label htmlFor="room-status">Trạng thái</Label><select id="room-status" name="status" defaultValue={editingRoom?.Status ?? RoomStatus.Available} className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value={RoomStatus.Available}>Khả dụng</option><option value={RoomStatus.Occupied}>Đang sử dụng</option><option value={RoomStatus.Maintenance}>Bảo trì</option></select></div>
            <div className="flex gap-2 sm:col-span-2"><Button type="submit" disabled={!editingRoom && atCapacity}>{editingRoom ? "Lưu thay đổi" : "Thêm phòng"}</Button><Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingRoom(null); }}>Hủy</Button></div>
          </form>
        </PortalSection>
      ) : null}
      {message ? <p role="status" className={`border px-4 py-3 text-sm ${message.startsWith("Không thể") || message.startsWith("Đã đạt") ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{message}</p> : null}
      <PortalSection title="Danh sách phòng" description={`${activeRooms.length} đang quản lý, ${deletedRooms} đã xóa`}>
        <PortalToolbar placeholder="Tìm tên hoặc mã phòng" filters={[{ label: "Tất cả trạng thái", options: ["Khả dụng", "Đang sử dụng", "Bảo trì", "Đã xóa"] }]} />
        <PortalTable caption="Danh sách phòng khám" columns={["Phòng", "Trạng thái", "Bản ghi", "Cập nhật", "Thao tác"]} rows={roomRows} />
      </PortalSection>
    </div>
  );
}

function StaffAccountsScreen() {
  return <OperationalTable eyebrow="Nhân sự chi nhánh" title="Tài khoản nhân sự" description="Tạo và quản lý Doctor, Staff, Warehouse Manager trong đúng phạm vi chi nhánh." action="Thêm nhân sự" metrics={[
    ["Tổng nhân sự", "86", "82 đang hoạt động", <UsersRound key="1" className="size-5" />],
    ["Bác sĩ", "42", "8 chuyên khoa", <Stethoscope key="2" className="size-5" />],
    ["Tiếp nhận", "31", "3 ca làm việc", <ClipboardCheck key="3" className="size-5" />],
    ["Kho thuốc", "13", "2 quản lý chính", <PackageCheck key="4" className="size-5" />],
  ]} columns={["Tài khoản", "Role", "Bộ phận", "Trạng thái", "Đăng nhập cuối"]} rows={[
    ["BS. Nguyễn Hoàng Minh", <StatusPill key="1" tone="blue">DOCTOR</StatusPill>, "Tim mạch", <StatusPill key="2" tone="green">Hoạt động</StatusPill>, "23/09 08:05"],
    ["Trần Thu Hà", <StatusPill key="3">STAFF</StatusPill>, "Tiếp nhận", <StatusPill key="4" tone="green">Hoạt động</StatusPill>, "23/09 06:48"],
    ["Lê Văn Tuấn", <StatusPill key="5" tone="amber">WAREHOUSE_MANAGER</StatusPill>, "Kho thuốc", <StatusPill key="6" tone="green">Hoạt động</StatusPill>, "23/09 07:12"],
    ["BS. Phạm Ngọc Anh", <StatusPill key="7" tone="blue">DOCTOR</StatusPill>, "Nhi khoa", <StatusPill key="8" tone="red">Vô hiệu hóa</StatusPill>, "18/09 16:20"],
  ]} />;
}

const appointmentRows = [
  ["09:30", "Nguyễn Thị Lan · BN-10248", "Khám bác sĩ", "BS. Nguyễn Hoàng Minh · P.203", <StatusPill key="1" tone="blue">Đã xác nhận</StatusPill>],
  ["09:45", "Trần Văn Phúc · BN-08421", "Khám tổng quát", "P.101", <StatusPill key="2" tone="amber">Chờ xác nhận</StatusPill>],
  ["10:00", "Lê Minh Châu · BN-11203", "Siêu âm tổng quát", "P.307", <StatusPill key="3" tone="green">Đã check-in</StatusPill>],
  ["10:15", "Phạm Thị Hồng · BN-09682", "Khám bác sĩ", "BS. Phạm Ngọc Anh · P.205", <StatusPill key="4" tone="blue">Đã xác nhận</StatusPill>],
  ["10:30", "Hoàng Nam Sơn · BN-11824", "Xét nghiệm máu", "P.108", <StatusPill key="5" tone="red">Đã hủy</StatusPill>],
];

function HospitalAppointmentsScreen() {
  return (
    <div className="space-y-6">
      <PortalPageHeader eyebrow="Điều phối khám" title="Lịch hẹn chi nhánh" description="Xác nhận, đổi lịch, gán phòng và theo dõi check-in của mọi lịch thuộc chi nhánh." actions={<PortalAction variant="default"><Plus />Tạo lịch thay bệnh nhân</PortalAction>} />
      <MetricGrid>
        <MetricCard label="Tổng lịch hôm nay" value="148" detail="Tăng 8,1% so với thứ Tư trước" trend="up" icon={<CalendarCheck2 className="size-5" />} />
        <MetricCard label="Chờ xác nhận" value="18" detail="Lịch gần nhất lúc 09:45" icon={<ShieldAlert className="size-5" />} tone="amber" />
        <MetricCard label="Đã check-in" value="92" detail="12 bệnh nhân đang chờ" icon={<ClipboardCheck className="size-5" />} tone="green" />
        <MetricCard label="Đã hủy" value="6" detail="4,1% lịch hôm nay" icon={<Activity className="size-5" />} tone="red" />
      </MetricGrid>
      <PortalSection title="Danh sách lịch hẹn">
        <PortalToolbar placeholder="Tìm tên, mã y tế hoặc số điện thoại" filters={[{ label: "Hôm nay", options: ["Ngày mai", "7 ngày tới"] }, { label: "Tất cả trạng thái", options: ["Chờ xác nhận", "Đã xác nhận", "Hoàn thành", "Đã hủy"] }, { label: "Tất cả loại lịch", options: ["Bệnh viện", "Bác sĩ", "Dịch vụ"] }]} />
        <PortalTable caption="Danh sách lịch hẹn chi nhánh" columns={["Giờ", "Bệnh nhân", "Loại lịch", "Bác sĩ / phòng", "Trạng thái"]} rows={appointmentRows} />
      </PortalSection>
    </div>
  );
}

function HospitalPrescriptionsScreen() {
  return <OperationalTable eyebrow="Điều phối đơn thuốc" title="Đơn thuốc chi nhánh" description="Theo dõi đơn khi có mục đích nghiệp vụ; không thay đổi nội dung chuyên môn của bác sĩ." metrics={[
    ["Đơn hôm nay", "74", "62 đơn đã hoàn tất", <ClipboardCheck key="1" className="size-5" />],
    ["Chưa thanh toán", "12", "Tổng tạm tính 3,8 triệu", <CircleDollarSign key="2" className="size-5" />],
    ["Đã thanh toán", "58", "78,4% tổng đơn", <PackageCheck key="3" className="size-5" />],
    ["Đã hủy", "4", "Đều có ghi nhận lý do", <ShieldAlert key="4" className="size-5" />],
  ]} columns={["Mã đơn", "Bệnh nhân", "Bác sĩ", "Tổng tiền", "Trạng thái"]} rows={[
    ["RX-260923-074", "Nguyễn Thị Lan", "BS. Nguyễn Hoàng Minh", "486.000 đ", <StatusPill key="1" tone="amber">Chưa thanh toán</StatusPill>],
    ["RX-260923-073", "Lê Minh Châu", "BS. Trần Thanh Vũ", "328.000 đ", <StatusPill key="2" tone="green">Đã thanh toán</StatusPill>],
    ["RX-260923-072", "Trần Văn Phúc", "BS. Nguyễn Hoàng Minh", "215.000 đ", <StatusPill key="3" tone="green">Đã thanh toán</StatusPill>],
    ["RX-260923-069", "Đỗ Hải Yến", "BS. Phạm Ngọc Anh", "0 đ", <StatusPill key="4" tone="red">Đã hủy</StatusPill>],
  ]} />;
}

function HospitalInventoryScreen() {
  return <OperationalTable eyebrow="Giám sát dược" title="Kho thuốc chi nhánh" description="Theo dõi tồn kho và duyệt phiếu nhập xuất theo nguyên tắc bốn mắt." action="Duyệt phiếu chờ" metrics={[
    ["Mặt hàng", "428", "392 thuốc đang hoạt động", <PackageCheck key="1" className="size-5" />],
    ["Dưới ngưỡng", "16", "5 mặt hàng mức nghiêm trọng", <ShieldAlert key="2" className="size-5" />],
    ["Phiếu chờ duyệt", "7", "5 nhập, 2 xuất", <ClipboardCheck key="3" className="size-5" />],
    ["Giá trị tồn", "1,84 tỷ", "Cập nhật lúc 09:35", <CircleDollarSign key="4" className="size-5" />],
  ]} columns={["Mã phiếu", "Loại", "Người tạo", "Số mặt hàng", "Tạo lúc", "Trạng thái"]} rows={[
    ["NK-260923-005", <StatusPill key="1" tone="green">Nhập kho</StatusPill>, "Lê Văn Tuấn", "12", "23/09 08:44", <StatusPill key="2" tone="amber">Chờ duyệt</StatusPill>],
    ["XK-260923-002", <StatusPill key="3" tone="blue">Xuất kho</StatusPill>, "Ngô Thanh Hà", "5", "23/09 08:12", <StatusPill key="4" tone="amber">Chờ duyệt</StatusPill>],
    ["NK-260922-018", <StatusPill key="5" tone="green">Nhập kho</StatusPill>, "Lê Văn Tuấn", "24", "22/09 16:32", <StatusPill key="6" tone="green">Đã duyệt</StatusPill>],
    ["XK-260922-011", <StatusPill key="7" tone="blue">Xuất kho</StatusPill>, "Ngô Thanh Hà", "8", "22/09 14:08", <StatusPill key="8" tone="red">Đã hủy</StatusPill>],
  ]} />;
}

function HospitalReviewsScreen() {
  return (
    <div className="space-y-6">
      <PortalPageHeader eyebrow="Chất lượng dịch vụ" title="Đánh giá người bệnh" description="Kiểm duyệt đánh giá liên quan đến cơ sở, bác sĩ và dịch vụ tại chi nhánh." />
      <MetricGrid>
        <MetricCard label="Điểm trung bình" value="4,7/5" detail="Từ 1.248 đánh giá" icon={<Star className="size-5" />} tone="amber" />
        <MetricCard label="Chưa xem" value="12" detail="5 đánh giá trong hôm nay" icon={<ShieldAlert className="size-5" />} />
        <MetricCard label="Đang hiển thị" value="1.196" detail="95,8% tổng đánh giá" icon={<ClipboardCheck className="size-5" />} tone="green" />
        <MetricCard label="Đã ẩn" value="52" detail="Có lý do kiểm duyệt" icon={<Activity className="size-5" />} tone="red" />
      </MetricGrid>
      <PortalSection title="Hàng chờ kiểm duyệt">
        <PortalToolbar placeholder="Tìm nội dung đánh giá" filters={[{ label: "Tất cả đối tượng", options: ["Cơ sở", "Bác sĩ", "Dịch vụ"] }, { label: "Số sao", options: ["5 sao", "4 sao", "1-3 sao"] }]} />
        <div className="grid gap-4 p-5 lg:grid-cols-2">
          {[
            ["Nguyễn T. L.", "5", "BS. Nguyễn Hoàng Minh", "Bác sĩ tư vấn kỹ, quy trình tiếp nhận nhanh và rõ ràng."],
            ["Trần V. P.", "4", "Siêu âm tổng quát", "Thời gian chờ hơi lâu nhưng nhân viên hỗ trợ nhiệt tình."],
            ["Lê M. C.", "5", "BV Đa khoa Thành Phố", "Cơ sở sạch sẽ, đặt lịch trước nên không phải chờ nhiều."],
            ["Phạm T. H.", "2", "Khoa Nhi", "Khó tìm khu vực phòng khám, cần bổ sung biển hướng dẫn."],
          ].map(([name, stars, target, content]) => (
            <article key={`${name}-${target}`} className="border p-5">
              <div className="flex items-start justify-between gap-4"><div><p className="font-semibold">{name}</p><p className="mt-1 text-xs text-muted-foreground">{target}</p></div><StatusPill tone={Number(stars) >= 4 ? "green" : "amber"}>{stars} sao</StatusPill></div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">{content}</p>
              <div className="mt-4 flex gap-2"><PortalAction variant="default">Hiển thị</PortalAction><PortalAction>Ẩn đánh giá</PortalAction></div>
            </article>
          ))}
        </div>
      </PortalSection>
    </div>
  );
}

function HospitalReportsScreen() {
  return (
    <div className="space-y-6">
      <PortalPageHeader eyebrow="Phân tích chi nhánh" title="Báo cáo vận hành" description="Theo dõi hiệu quả lịch khám, công suất phòng và doanh thu dự kiến tại chi nhánh." actions={<PortalAction variant="default">Tải báo cáo</PortalAction>} />
      <MetricGrid>
        <MetricCard label="Lịch tháng này" value="2.845" detail="Tăng 9,6% so với tháng trước" trend="up" icon={<CalendarCheck2 className="size-5" />} />
        <MetricCard label="Hoàn thành" value="88,2%" detail="Mục tiêu tháng là 85%" trend="up" icon={<ClipboardCheck className="size-5" />} tone="green" />
        <MetricCard label="Công suất phòng" value="76%" detail="Cao điểm 09:00 - 11:00" icon={<BedDouble className="size-5" />} tone="cyan" />
        <MetricCard label="Doanh thu dự kiến" value="3,24 tỷ" detail="Khám, dịch vụ và đơn thuốc" icon={<CircleDollarSign className="size-5" />} tone="amber" />
      </MetricGrid>
      <div className="grid gap-6 lg:grid-cols-2">
        <PortalSection title="Hiệu suất chuyên khoa"><ProgressList items={[
          { label: "Tim mạch", value: 92, display: "92%" },
          { label: "Nội tổng quát", value: 84, display: "84%", color: "bg-cyan-500" },
          { label: "Nhi khoa", value: 78, display: "78%", color: "bg-emerald-500" },
          { label: "Cơ xương khớp", value: 65, display: "65%", color: "bg-amber-500" },
        ]} /></PortalSection>
        <PortalSection title="Cơ cấu doanh thu"><ProgressList items={[
          { label: "Dịch vụ y tế", value: 74, display: "1,42 tỷ" },
          { label: "Khám bác sĩ", value: 58, display: "1,08 tỷ", color: "bg-cyan-500" },
          { label: "Đơn thuốc", value: 41, display: "740 triệu", color: "bg-emerald-500" },
        ]} /></PortalSection>
      </div>
    </div>
  );
}

function HospitalAuditScreen() {
  return (
    <div className="space-y-6">
      <PortalPageHeader eyebrow="Kiểm toán chi nhánh" title="Nhật ký hoạt động" description="Theo dõi thay đổi trạng thái, phê duyệt và truy cập nghiệp vụ trong chi nhánh." actions={<PortalAction>Xuất nhật ký</PortalAction>} />
      <PortalSection title="Hoạt động gần đây">
        <PortalToolbar placeholder="Tìm nhân sự hoặc hành động" filters={[{ label: "Tất cả phân hệ", options: ["Lịch hẹn", "Kho thuốc", "Nhân sự", "Phòng"] }]} />
        <PortalTable caption="Nhật ký chi nhánh" columns={["Thời gian", "Nhân sự", "Hành động", "Đối tượng", "Kết quả"]} rows={[
          ["23/09 09:38", "Trần Thu Hà", "appointment.check_in", "APT-10248", <StatusPill key="1" tone="green">Thành công</StatusPill>],
          ["23/09 09:22", "Nguyễn Minh Anh", "stock_ticket.confirm", "NK-260923-004", <StatusPill key="2" tone="green">Thành công</StatusPill>],
          ["23/09 08:56", "Lê Văn Tuấn", "inventory.adjust", "MED-0182", <StatusPill key="3" tone="amber">Đã ghi lý do</StatusPill>],
          ["23/09 08:31", "Trần Thu Hà", "appointment.assign_room", "APT-10244", <StatusPill key="4" tone="green">Thành công</StatusPill>],
        ]} />
      </PortalSection>
    </div>
  );
}

function OperationalTable({ eyebrow, title, description, action, metrics, columns, rows }: { eyebrow: string; title: string; description: string; action?: string; metrics: [string, string, string, React.ReactNode][]; columns: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="space-y-6">
      <PortalPageHeader eyebrow={eyebrow} title={title} description={description} actions={action ? <PortalAction variant="default"><Plus />{action}</PortalAction> : undefined} />
      <MetricGrid>{metrics.map(([label, value, detail, icon], index) => <MetricCard key={label} label={label} value={value} detail={detail} icon={icon} tone={(["blue", "cyan", "green", "amber"] as const)[index]} />)}</MetricGrid>
      <PortalSection title={`Danh sách ${title.toLowerCase()}`}>
        <PortalToolbar placeholder={`Tìm trong ${title.toLowerCase()}`} filters={[{ label: "Tất cả trạng thái", options: ["Hoạt động", "Chờ xử lý", "Đã hoàn tất", "Đã hủy"] }]} />
        <PortalTable caption={`Danh sách ${title.toLowerCase()}`} columns={columns} rows={rows} />
      </PortalSection>
    </div>
  );
}

type HospitalProfileDraft = {
  Name: string;
  Slug: string;
  Address: string;
  WorkingHour: string;
  NumberOfRoom: string;
  Description: string;
};

function toHospitalProfileDraft(hospital: Hospital): HospitalProfileDraft {
  return {
    Name: hospital.Name,
    Slug: hospital.Slug,
    Address: hospital.Address,
    WorkingHour: hospital.WorkingHour,
    NumberOfRoom: String(hospital.NumberOfRoom),
    Description: hospital.Description,
  };
}

function getHospitalSaveError(
  error: unknown,
  fallback = "Không thể lưu thông tin chi nhánh. Vui lòng thử lại.",
) {
  if (isAxiosError<{ Message?: string; message?: string }>(error)) {
    return (
      error.response?.data?.Message ??
      error.response?.data?.message ??
      fallback
    );
  }

  return error instanceof Error && error.message
    ? error.message
    : fallback;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  min,
  step,
  required = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  min?: string;
  step?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const id = `hospital-${label.toLowerCase().replaceAll(" ", "-")}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        min={min}
        step={step}
        value={value}
        required={required}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </div>
  );
}

function formatHospitalDate(value: Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có dữ liệu";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
