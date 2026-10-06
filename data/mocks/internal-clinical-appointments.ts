import { getVietnamToday, toAppointmentIso } from "@/lib/booking/working-hours";
import type { ClinicalAppointment } from "@/types/internal-clinical";

const today = getVietnamToday();

function appointment(
  data: Omit<ClinicalAppointment, "AppointmentAt" | "DoctorNote"> & {
    Time: string;
    DoctorNote?: string;
  },
): ClinicalAppointment {
  const { Time, DoctorNote = "", ...rest } = data;
  return {
    ...rest,
    AppointmentAt: new Date(toAppointmentIso(today, Time)),
    DoctorNote,
  };
}

export const mockInternalClinicalAppointments: ClinicalAppointment[] = [
  appointment({
    Uuid: "9df649f8-a02d-41a4-a1ab-5a0a377ff101",
    PatientName: "Nguyễn Văn Hải",
    Gender: "Male",
    MedicalCode: "BN-10231",
    Note: "Tái khám theo lịch hẹn của bác sĩ.",
    Time: "08:00",
    TypeLabel: "Tái khám tim mạch",
    RoomName: "P.203",
    Status: "Done",
    DoctorNote: "Đã hoàn tất thăm khám.",
  }),
  appointment({
    Uuid: "9df649f8-a02d-41a4-a1ab-5a0a377ff102",
    PatientName: "Lê Thị Thanh",
    Gender: "Female",
    MedicalCode: "BN-09128",
    Note: "Khám theo lịch bác sĩ phụ trách.",
    Time: "08:45",
    TypeLabel: "Khám theo bác sĩ",
    RoomName: "P.203",
    Status: "Done",
  }),
  appointment({
    Uuid: "9df649f8-a02d-41a4-a1ab-5a0a377ff103",
    PatientName: "Nguyễn Thị Lan",
    Gender: "Female",
    MedicalCode: "BN-10248",
    Note: "Đau ngực nhẹ khi vận động trong 3 ngày gần đây.",
    Time: "09:30",
    TypeLabel: "Khám theo bác sĩ",
    RoomName: "P.203",
    Status: "CheckedIn",
  }),
  appointment({
    Uuid: "9df649f8-a02d-41a4-a1ab-5a0a377ff104",
    PatientName: "Phạm Minh Đức",
    Gender: "Male",
    MedicalCode: "BN-08245",
    Note: "Tái khám định kỳ.",
    Time: "10:15",
    TypeLabel: "Tái khám",
    RoomName: "P.203",
    Status: "Pending",
  }),
  appointment({
    Uuid: "9df649f8-a02d-41a4-a1ab-5a0a377ff105",
    PatientName: "Trần Thu Hương",
    Gender: "Female",
    MedicalCode: "BN-11408",
    Note: "Khám theo lịch đã xác nhận.",
    Time: "11:00",
    TypeLabel: "Khám theo bác sĩ",
    RoomName: "P.203",
    Status: "Approved",
  }),
];
