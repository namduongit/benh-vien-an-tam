import { AppointmentStatus } from "@/types/models";
import type { AppointmentPresentation, BookingType } from "@/types/appointments";

const statusConfig = {
  [AppointmentStatus.Pending]: {
    label: "Chờ duyệt",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  [AppointmentStatus.Approved]: {
    label: "Đã duyệt",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  [AppointmentStatus.Unconfirmed]: {
    label: "Không xác nhận",
    className: "border-orange-200 bg-orange-50 text-orange-800",
  },
  [AppointmentStatus.CheckedIn]: {
    label: "Đang khám",
    className: "border-blue-200 bg-blue-50 text-blue-800",
  },
  [AppointmentStatus.Done]: {
    label: "Đã hoàn thành",
    className: "border-slate-200 bg-slate-100 text-slate-700",
  },
  [AppointmentStatus.Cancelled]: {
    label: "Đã hủy",
    className: "border-red-200 bg-red-50 text-red-700",
  },
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
}

export function getAppointmentStatusLabel(status: AppointmentStatus) {
  return statusConfig[status].label;
}

export function getAppointmentTypeLabel(type: BookingType) {
  if (type === "hospital") return "Khám tại cơ sở";
  if (type === "doctor") return "Khám với bác sĩ";
  return "Dịch vụ y tế";
}

export function getAppointmentTargetLabel(type: BookingType) {
  if (type === "doctor") return "Bác sĩ";
  if (type === "medical-service") return "Dịch vụ";
  return "Cơ sở y tế";
}

export function getPublicTargetHref(item: AppointmentPresentation) {
  if (item.Type === "doctor") return `/bac-si/${item.TargetSlug}`;
  if (item.Type === "medical-service") return `/dich-vu/${item.TargetSlug}`;
  return `/co-so-y-te/${item.HospitalSlug}`;
}

export function canChangeAppointment(item: AppointmentPresentation, now: number) {
  const editable =
    item.Appointment.Status === AppointmentStatus.Pending ||
    item.Appointment.Status === AppointmentStatus.Approved;
  return editable && item.Appointment.AppointmentAt.getTime() - now >= 86_400_000;
}
