"use client";

import { useEffect, useState, type FormEvent } from "react";
import { isAxiosError } from "axios";

import { ErrorState, LoadingState } from "@/components/shared/data-state";
import {
  PortalPageHeader,
  PortalSection,
  PortalTable,
  StatusPill,
} from "@/components/internal/portal-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { branchAppointmentService, type BranchAppointment, type BranchAppointmentResources } from "@/lib/services/hospital/BranchAppointmentService";
import { hospitalService } from "@/lib/services/hospital/HospitalService";
import {
  AppointmentMedicalServiceStatus,
  AppointmentStatus,
  AppointmentType,
  type Hospital,
} from "@/types/models";

type ScreenState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "success";
      hospital: Hospital;
      appointments: BranchAppointment[];
      resources: BranchAppointmentResources;
    };

const statusLabels: Record<AppointmentStatus, string> = {
  [AppointmentStatus.Pending]: "Chờ duyệt",
  [AppointmentStatus.Approved]: "Đã duyệt",
  [AppointmentStatus.Unconfirmed]: "Không xác nhận",
  [AppointmentStatus.CheckedIn]: "Đang khám",
  [AppointmentStatus.Done]: "Hoàn thành",
  [AppointmentStatus.Cancelled]: "Đã hủy",
};

const typeLabels: Record<AppointmentType, string> = {
  [AppointmentType.Doctor]: "Khám bác sĩ",
  [AppointmentType.Hospital]: "Khám tại viện",
  [AppointmentType.Service]: "Khám dịch vụ",
};

const vietnamDate = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" });
const vietnamDateTime = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

export function BranchAppointmentsScreen() {
  const [attempt, setAttempt] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<AppointmentType | "all">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selected, setSelected] = useState<BranchAppointment | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [doctorNote, setDoctorNote] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<ScreenState>(() =>
    process.env.NEXT_PUBLIC_USE_MOCK_API === "false"
      ? {
          status: "error",
          message: "Quản lý lịch hẹn chi nhánh hiện chỉ hỗ trợ mock API.",
        }
      : { status: "loading" },
  );

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    if (process.env.NEXT_PUBLIC_USE_MOCK_API === "false") {
      return () => {
        active = false;
        controller.abort();
      };
    }

    const query = {
      search: search.trim() || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      type: typeFilter === "all" ? undefined : typeFilter,
      from: fromDate || undefined,
      to: toDate || undefined,
      page: 1,
      pageSize: 100,
    };
    hospitalService
      .getBranchProfile(controller.signal)
      .then(async ({ Data: hospital }) => {
        const [firstPage, resourcesResponse] = await Promise.all([
          branchAppointmentService.getAll(hospital.Uuid, query, controller.signal),
          branchAppointmentService.getResources(hospital.Uuid, controller.signal),
        ]);
        const remainingPages = await Promise.all(
          Array.from(
            { length: Math.max(firstPage.Data.TotalPages - 1, 0) },
            (_, index) =>
              branchAppointmentService.getAll(
                hospital.Uuid,
                { ...query, page: index + 2 },
                controller.signal,
              ),
          ),
        );
        if (!active) return;

        const appointments = [
          ...firstPage.Data.Items,
          ...remainingPages.flatMap((page) => page.Data.Items),
        ];
        setState({
          status: "success",
          hospital,
          appointments,
          resources: resourcesResponse.Data,
        });
        setSelected((current) =>
          current
            ? appointments.find((item) => item.Uuid === current.Uuid) ?? null
            : null,
        );
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            status: "error",
            message: getError(
              error,
              "Không thể tải lịch hẹn chi nhánh. Vui lòng thử lại.",
            ),
          });
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt, fromDate, search, statusFilter, toDate, typeFilter]);

  if (state.status === "loading") {
    return <LoadingState label="Đang tải lịch hẹn chi nhánh" />;
  }
  if (state.status === "error") {
    return (
      <ErrorState
        message={state.message}
        onRetry={() => {
          setState({ status: "loading" });
          setAttempt((current) => current + 1);
        }}
      />
    );
  }

  const { hospital, appointments, resources } = state;

  function updateLocal(updated: BranchAppointment) {
    setState((current) =>
      current.status === "success"
        ? {
            ...current,
            appointments: current.appointments.map((item) =>
              item.Uuid === updated.Uuid ? updated : item,
            ),
          }
        : current,
    );
    setSelected(updated);
  }

  async function runAction(
    action: () => Promise<{ Data: BranchAppointment }>,
    successMessage: string,
  ) {
    if (isSaving) return;
    setIsSaving(true);
    setMessage("");
    try {
      const response = await action();
      updateLocal(response.Data);
      setMessage(successMessage);
    } catch (error) {
      setMessage(getError(error, "Không thể cập nhật lịch hẹn. Vui lòng thử lại."));
    } finally {
      setIsSaving(false);
    }
  }

  async function assignResources(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    await runAction(
      () =>
        branchAppointmentService.assign(hospital.Uuid, selected.Uuid, {
          doctorUuid: selectedDoctor || null,
          roomUuid: selectedRoom || null,
        }),
      "Đã cập nhật phân công bác sĩ và phòng khám.",
    );
  }

  async function addService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !selectedService) return;
    await runAction(
      () =>
        branchAppointmentService.addService(
          hospital.Uuid,
          selected.Uuid,
          selectedService,
          serviceDescription,
        ),
      "Đã thêm dịch vụ phát sinh và cập nhật tổng chi phí.",
    );
    setSelectedService("");
    setServiceDescription("");
  }

  async function saveDoctorNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    await runAction(
      () =>
        branchAppointmentService.updateNote(
          hospital.Uuid,
          selected.Uuid,
          doctorNote,
        ),
      "Đã lưu ghi chú chuyên môn.",
    );
  }

  const rows = appointments.map((appointment) => [
    <div key={`${appointment.Uuid}-date`}>
      <p>{vietnamDate.format(appointment.AppointmentDate)}</p>
      <p className="mt-1 text-xs text-muted-foreground">{appointment.Time}</p>
    </div>,
    <div key={`${appointment.Uuid}-patient`}>
      <p className="font-medium">{appointment.PatientName}</p>
      <p className="mt-1 font-mono text-xs text-muted-foreground">{appointment.MedicalCode}</p>
    </div>,
    typeLabels[appointment.Type],
    <div key={`${appointment.Uuid}-assignment`}>
      <p>{appointment.DoctorName ?? "Chưa phân công bác sĩ"}</p>
      <p className="mt-1 text-xs text-muted-foreground">{appointment.RoomName ?? "Chưa gán phòng"}</p>
    </div>,
    <StatusPill
      key={`${appointment.Uuid}-status`}
      tone={
        appointment.Status === AppointmentStatus.Pending
          ? "amber"
          : appointment.Status === AppointmentStatus.Approved
            ? "blue"
            : appointment.Status === AppointmentStatus.CheckedIn
            ? "blue"
            : appointment.Status === AppointmentStatus.Done
              ? "green"
              : appointment.Status === AppointmentStatus.Unconfirmed
                ? "amber"
                : "red"
      }
    >
      {statusLabels[appointment.Status]}
    </StatusPill>,
    <Button
      key={`${appointment.Uuid}-details`}
      type="button"
      size="sm"
      variant={selected?.Uuid === appointment.Uuid ? "default" : "outline"}
      onClick={() => {
        setSelected(appointment);
        setSelectedDoctor(appointment.DoctorUuid ?? "");
        setSelectedRoom(appointment.RoomUuid ?? "");
        setDoctorNote(appointment.DoctorNote);
        setMessage("");
      }}
    >
      Chi tiết
    </Button>,
  ]);

  return (
    <div className="space-y-6">
      <PortalPageHeader
        eyebrow="Điều phối khám"
        title="Lịch hẹn chi nhánh"
        description={`Lịch hẹn được giới hạn trong ${hospital.Name}; điều phối bệnh nhân, bác sĩ và phòng theo ca làm việc.`}
      />
      {message ? (
        <p
          role={message.startsWith("Không thể") ? "alert" : "status"}
          className={`border px-4 py-3 text-sm ${message.startsWith("Không thể") ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}
        >
          {message}
        </p>
      ) : null}
      <PortalSection title="Danh sách lịch hẹn" description={`${appointments.length} lịch theo điều kiện lọc`}>
        <div className="grid gap-3 border-b bg-[#fbfdfe] p-4 sm:grid-cols-2 xl:grid-cols-5">
          <Input
            aria-label="Tìm bệnh nhân hoặc mã y tế"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder="Tên, mã y tế, bác sĩ"
            className="h-9"
          />
          <Input aria-label="Từ ngày" type="date" value={fromDate} onChange={(event) => setFromDate(event.currentTarget.value)} className="h-9" />
          <Input aria-label="Đến ngày" type="date" value={toDate} onChange={(event) => setToDate(event.currentTarget.value)} className="h-9" />
          <select
            aria-label="Lọc trạng thái lịch hẹn"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.currentTarget.value as AppointmentStatus | "all")}
            className="h-9 rounded-md border bg-white px-3 text-sm"
          >
            <option value="all">Mọi trạng thái</option>
            {Object.values(AppointmentStatus).map((status) => (
              <option key={status} value={status}>{statusLabels[status]}</option>
            ))}
          </select>
          <select
            aria-label="Lọc loại lịch hẹn"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.currentTarget.value as AppointmentType | "all")}
            className="h-9 rounded-md border bg-white px-3 text-sm"
          >
            <option value="all">Mọi loại lịch</option>
            {Object.values(AppointmentType).map((type) => (
              <option key={type} value={type}>{typeLabels[type]}</option>
            ))}
          </select>
        </div>
        {rows.length ? (
          <PortalTable
            caption="Lịch hẹn thuộc chi nhánh"
            columns={["Ngày / giờ", "Bệnh nhân", "Loại lịch", "Bác sĩ / phòng", "Trạng thái", ""]}
            rows={rows}
          />
        ) : (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Không có lịch hẹn phù hợp với bộ lọc.
          </p>
        )}
      </PortalSection>

      {selected ? (
        <PortalSection
          title={`Chi tiết lịch · ${selected.PatientName}`}
          description={`${selected.MedicalCode} · ${vietnamDateTime.format(selected.AppointmentDate)} · ${selected.Time}`}
        >
          <div className="grid gap-5 p-5 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Detail label="Giới tính" value={selected.Gender} />
                <Detail label="Loại lịch" value={typeLabels[selected.Type]} />
                <Detail label="Điện thoại" value={selected.IsWalkIn ? "Khách vãng lai" : "Tài khoản người bệnh"} />
                <Detail label="Thanh toán" value={selected.IsPaid ? "Đã thanh toán" : "Chưa thanh toán"} />
              </div>
              <div className="border p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ghi chú khi đặt lịch</p>
                <p className="mt-2 whitespace-pre-wrap text-sm">{selected.Note || "Không có ghi chú."}</p>
              </div>
              <div className="space-y-3 border p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">Chi phí</p>
                  <p className="font-semibold">{selected.TotalPrice.toLocaleString("vi-VN")} đ</p>
                </div>
                {selected.Services.map((service) => (
                  <div key={service.Uuid} className="flex items-center justify-between gap-3 border-t pt-3 text-sm">
                    <div>
                      <p>{service.Name}</p>
                      <p className="text-xs text-muted-foreground">{service.Description || "Không có ghi chú"}</p>
                    </div>
                    <div className="text-right">
                      <p>{service.Price.toLocaleString("vi-VN")} đ</p>
                      {service.Status === AppointmentMedicalServiceStatus.InProgress &&
                      (selected.Status === AppointmentStatus.Approved ||
                        selected.Status === AppointmentStatus.CheckedIn) ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isSaving}
                          onClick={() =>
                            void runAction(
                              () => branchAppointmentService.completeService(hospital.Uuid, selected.Uuid, service.Uuid),
                              `Đã hoàn tất dịch vụ ${service.Name}.`,
                            )
                          }
                        >
                          Hoàn tất dịch vụ
                        </Button>
                      ) : (
                        <StatusPill tone={service.Status === AppointmentMedicalServiceStatus.Completed ? "green" : "amber"}>
                          {service.Status === AppointmentMedicalServiceStatus.Completed ? "Đã hoàn tất" : "Đang thực hiện"}
                        </StatusPill>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {(selected.Status === AppointmentStatus.Approved ||
                selected.Status === AppointmentStatus.CheckedIn) ? (
                <form onSubmit={addService} className="grid gap-3 border p-4 sm:grid-cols-2">
                  <Label className="sm:col-span-2">Thêm dịch vụ phát sinh</Label>
                  <select
                    aria-label="Dịch vụ phát sinh"
                    value={selectedService}
                    onChange={(event) => setSelectedService(event.currentTarget.value)}
                    className="h-10 rounded-md border bg-white px-3 text-sm"
                  >
                    <option value="">Chọn dịch vụ</option>
                    {resources.Services.map((service) => (
                      <option key={service.Uuid} value={service.Uuid}>
                        {service.Name} · {service.Price.toLocaleString("vi-VN")} đ
                      </option>
                    ))}
                  </select>
                  <Input
                    aria-label="Ghi chú dịch vụ phát sinh"
                    value={serviceDescription}
                    onChange={(event) => setServiceDescription(event.currentTarget.value)}
                    placeholder="Mô tả / ghi chú"
                    maxLength={500}
                  />
                  <Button type="submit" disabled={isSaving || !selectedService} className="sm:col-span-2">
                    Thêm vào lịch hẹn
                  </Button>
                </form>
              ) : null}
            </div>

            <div className="space-y-4">
              {selected.Status !== AppointmentStatus.Done &&
              selected.Status !== AppointmentStatus.Cancelled &&
              selected.Status !== AppointmentStatus.Unconfirmed ? (
                <>
                  <form onSubmit={assignResources} className="space-y-3 border p-4">
                    <h3 className="font-semibold">Phân công nguồn lực</h3>
                    <div className="space-y-2">
                      <Label htmlFor="appointment-doctor">Bác sĩ trực đúng khung giờ</Label>
                      <select
                        id="appointment-doctor"
                        value={selectedDoctor}
                        onChange={(event) => setSelectedDoctor(event.currentTarget.value)}
                        className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                      >
                        <option value="">Chưa phân công</option>
                        {resources.Doctors.map((doctor) => (
                          <option key={doctor.Uuid} value={doctor.Uuid}>{doctor.Name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="appointment-room">Phòng còn khả dụng</Label>
                      <select
                        id="appointment-room"
                        value={selectedRoom}
                        onChange={(event) => setSelectedRoom(event.currentTarget.value)}
                        className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                      >
                        <option value="">Chưa gán phòng</option>
                        {resources.Rooms.map((room) => (
                          <option key={room.Uuid} value={room.Uuid}>{room.Name}</option>
                        ))}
                      </select>
                    </div>
                    <Button type="submit" variant="outline" disabled={isSaving}>Lưu phân công</Button>
                  </form>
                  <form onSubmit={saveDoctorNote} className="space-y-3 border p-4">
                    <Label htmlFor="appointment-doctor-note">Ghi chú bác sĩ</Label>
                    <Textarea
                      id="appointment-doctor-note"
                      value={doctorNote}
                      onChange={(event) => setDoctorNote(event.currentTarget.value)}
                      rows={3}
                      maxLength={4000}
                      placeholder="Chẩn đoán ban đầu, lời dặn hoặc thông tin cần theo dõi"
                    />
                    <Button type="submit" variant="outline" disabled={isSaving}>Lưu ghi chú</Button>
                  </form>
                </>
              ) : (
                <div className="border p-4">
                  <p className="text-sm font-semibold">Ghi chú bác sĩ</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{selected.DoctorNote || "Chưa có ghi chú."}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2 border p-4">
                {selected.Status === AppointmentStatus.Pending ? (
                  <>
                    <Button
                      type="button"
                      disabled={isSaving}
                      onClick={() =>
                        void runAction(
                          () => branchAppointmentService.updateStatus(hospital.Uuid, selected.Uuid, AppointmentStatus.Approved),
                          "Đã duyệt lịch hẹn.",
                        )
                      }
                    >
                      Duyệt lịch
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={isSaving}
                      onClick={() =>
                        void runAction(
                          () => branchAppointmentService.updateStatus(hospital.Uuid, selected.Uuid, AppointmentStatus.Cancelled),
                          "Đã hủy lịch hẹn.",
                        )
                      }
                    >
                      Hủy lịch
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSaving}
                      onClick={() =>
                        void runAction(
                          () => branchAppointmentService.updateStatus(hospital.Uuid, selected.Uuid, AppointmentStatus.Unconfirmed),
                          "Đã đánh dấu lịch không xác nhận.",
                        )
                      }
                    >
                      Không xác nhận
                    </Button>
                  </>
                ) : null}
                {selected.Status === AppointmentStatus.Approved ? (
                  <>
                    <Button
                      type="button"
                      disabled={isSaving}
                      onClick={() =>
                        void runAction(
                          () => branchAppointmentService.updateStatus(hospital.Uuid, selected.Uuid, AppointmentStatus.CheckedIn),
                          "Đã check-in; lịch chuyển sang trạng thái đang khám.",
                        )
                      }
                    >
                      Xác nhận check-in
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={isSaving}
                      onClick={() =>
                        void runAction(
                          () => branchAppointmentService.updateStatus(hospital.Uuid, selected.Uuid, AppointmentStatus.Cancelled),
                          "Đã hủy lịch hẹn.",
                        )
                      }
                    >
                      Hủy lịch
                    </Button>
                  </>
                ) : null}
                {selected.Status === AppointmentStatus.Approved ||
                selected.Status === AppointmentStatus.CheckedIn ? (
                  <>
                    <Button
                      type="button"
                      variant={selected.IsPaid ? "outline" : "secondary"}
                      disabled={isSaving}
                      onClick={() =>
                        void runAction(
                          () => branchAppointmentService.updatePayment(hospital.Uuid, selected.Uuid, !selected.IsPaid),
                          selected.IsPaid ? "Đã ghi nhận chưa thanh toán." : "Đã ghi nhận thanh toán tại quầy.",
                        )
                      }
                    >
                      {selected.IsPaid ? "Đánh dấu chưa thanh toán" : "Ghi nhận đã thanh toán"}
                    </Button>
                  </>
                ) : null}
                {selected.Status === AppointmentStatus.CheckedIn ? (
                  <Button
                      type="button"
                      disabled={isSaving || !selected.IsPaid}
                      onClick={() =>
                        void runAction(
                          () => branchAppointmentService.complete(hospital.Uuid, selected.Uuid, doctorNote),
                          "Đã hoàn tất lịch và giải phóng phòng khám.",
                        )
                      }
                    >
                      Hoàn tất lịch khám
                    </Button>
                ) : null}
              </div>
            </div>
          </div>
        </PortalSection>
      ) : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function getError(error: unknown, fallback: string) {
  if (isAxiosError<{ error?: string; message?: string }>(error)) {
    switch (error.response?.data?.error) {
      case "DOCTOR_NOT_SCHEDULED":
        return "Bác sĩ không có lịch trực ở khung giờ của lịch hẹn.";
      case "DOCTOR_SLOT_TAKEN":
        return "Bác sĩ đã được phân công lịch khác trong khung giờ này.";
      case "ROOM_SLOT_TAKEN":
        return "Phòng đã có lịch khác trong khung giờ này.";
      case "ROOM_NOT_AVAILABLE":
        return "Phòng không còn khả dụng hoặc không thuộc chi nhánh này.";
      case "PAYMENT_REQUIRED":
        return "Cần ghi nhận thanh toán trước khi hoàn tất lịch khám.";
      case "SERVICES_INCOMPLETE":
        return "Hãy hoàn tất các dịch vụ phát sinh trước khi kết thúc lịch.";
      case "SERVICE_NOT_AVAILABLE":
        return "Dịch vụ này chưa được gán cho chi nhánh.";
      case "INVALID_APPOINTMENT_STATE":
        return "Trạng thái lịch đã thay đổi; hãy tải lại và kiểm tra.";
      default:
        return error.response?.data?.message
          ? `Không thể thực hiện: ${error.response.data.message}`
          : fallback;
    }
  }
  return error instanceof Error && error.message
    ? `Không thể thực hiện: ${error.message}`
    : fallback;
}
