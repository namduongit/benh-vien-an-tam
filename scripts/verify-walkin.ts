// Verify walk-in endpoint cho Tiếp nhận & điều phối
import axios from "axios";

import { attachMockApi } from "../lib/http/mock-api";

const STAFF_UUID = "8c2f1d4a-77b3-4f4e-9c1a-1f7b6c5d4e02";
const PATIENT_UUID = "dfbd3aa5-ab7a-4ad7-a0a1-e870f38129b8";
const DOCTOR_UUID = "57479ec8-29e0-44af-a8b0-15041655c5b8";
const HOSPITAL_UUID = "a4a0a61f-577d-48cb-94b9-c9ce85554b11";
const SERVICE_UUID = "227a9731-1a64-41c5-a934-ef464fc4d416";

const client = axios.create({ baseURL: "http://localhost:0" });
attachMockApi(client);

async function expect(label: string, promise: Promise<unknown>, expectStatus?: number) {
  try {
    const res = await promise;
    console.log(`[OK] ${label}: status=${(res as { status: number }).status}`);
    return res;
  } catch (err) {
    const e = err as { response?: { status: number; data?: unknown }; message: string };
    if (expectStatus && e.response?.status === expectStatus) {
      console.log(`[OK] ${label}: status=${e.response.status} (expected)`);
      return e.response;
    }
    console.log(`[FAIL] ${label}:`, e.response?.status, e.response?.data ?? e.message);
    return null;
  }
}

async function main() {
  console.log("=== Test 1: STAFF không auth → 403 ===");
  await expect(
    "GET availability no auth",
    client.get("/appointments/walk-in/availability", {
      params: { type: "doctor", targetUuid: DOCTOR_UUID, hospitalUuid: HOSPITAL_UUID, date: "2026-10-05" },
    }),
    403,
  );

  console.log("\n=== Test 2: STAFF auth → lấy availability thành công ===");
  const availability = await expect(
    "GET availability with staff auth",
    client.get("/appointments/walk-in/availability", {
      headers: { "X-Mock-Account-Uuid": STAFF_UUID },
      params: { type: "doctor", targetUuid: DOCTOR_UUID, hospitalUuid: HOSPITAL_UUID, date: "2026-10-05" },
    }),
  );
  if (availability) {
    const data = (availability as { data: { Data: { WorkingHour: string; Slots: unknown[] } } }).data;
    console.log("  WorkingHour:", data.Data.WorkingHour);
    console.log("  Slots:", data.Data.Slots.length, "slots");
  }

  console.log("\n=== Test 3: STAFF auth → tạo walk-in appointment thành công ===");
  const create = await expect(
    "POST walk-in",
    client.post(
      "/appointments/walk-in",
      {
        Type: "doctor",
        HospitalUuid: HOSPITAL_UUID,
        DoctorUuid: DOCTOR_UUID,
        PatientName: "Nguyễn Vãng Lai",
        Gender: "Male",
        Phone: "0987654321",
        Birthdate: "1990-01-15",
        MedicalCode: "KH-220002",
        Note: "Khách vãng lai tạo bởi nhân viên tiếp nhận",
        AppointmentAt: "2026-10-06T09:00:00+07:00",
      },
      { headers: { "X-Mock-Account-Uuid": STAFF_UUID } },
    ),
  );
  if (create) {
    const data = (create as { data: { Data: { Uuid: string; IsWalkIn: boolean; GuestPhone: string; PatientUuid: string | null; AccountUuid: string } } }).data;
    console.log("  Uuid:", data.Data.Uuid);
    console.log("  IsWalkIn:", data.Data.IsWalkIn);
    console.log("  GuestPhone:", data.Data.GuestPhone);
    console.log("  PatientUuid:", data.Data.PatientUuid, "(should be empty)");
    console.log("  AccountUuid:", data.Data.AccountUuid, "(should be empty)");
  }

  console.log("\n=== Test 4: PATIENT auth → bị reject ===");
  await expect(
    "POST walk-in as patient",
    client.post(
      "/appointments/walk-in",
      {
        Type: "doctor",
        HospitalUuid: HOSPITAL_UUID,
        DoctorUuid: DOCTOR_UUID,
        PatientName: "Test",
        Gender: "Male",
        Phone: "0987654321",
        Birthdate: "1990-01-15",
        MedicalCode: "KH-X",
        Note: "",
        AppointmentAt: "2026-10-06T10:00:00+07:00",
      },
      { headers: { "X-Mock-Account-Uuid": PATIENT_UUID } },
    ),
    403,
  );

  console.log("\n=== Test 5: Validation - phone không hợp lệ ===");
  await expect(
    "POST walk-in invalid phone",
    client.post(
      "/appointments/walk-in",
      {
        Type: "doctor",
        HospitalUuid: HOSPITAL_UUID,
        DoctorUuid: DOCTOR_UUID,
        PatientName: "Test",
        Gender: "Male",
        Phone: "abc",
        Birthdate: "1990-01-15",
        MedicalCode: "KH-X",
        Note: "",
        AppointmentAt: "2026-10-06T11:00:00+07:00",
      },
      { headers: { "X-Mock-Account-Uuid": STAFF_UUID } },
    ),
    422,
  );

  console.log("\n=== Test 6: Validation - birthdate tương lai ===");
  await expect(
    "POST walk-in future birthdate",
    client.post(
      "/appointments/walk-in",
      {
        Type: "doctor",
        HospitalUuid: HOSPITAL_UUID,
        DoctorUuid: DOCTOR_UUID,
        PatientName: "Test",
        Gender: "Male",
        Phone: "0987654321",
        Birthdate: "2099-01-01",
        MedicalCode: "KH-X",
        Note: "",
        AppointmentAt: "2026-10-06T12:00:00+07:00",
      },
      { headers: { "X-Mock-Account-Uuid": STAFF_UUID } },
    ),
    422,
  );

  console.log("\n=== Test 7: Validation - appointmentAt quá khứ ===");
  await expect(
    "POST walk-in past appointment",
    client.post(
      "/appointments/walk-in",
      {
        Type: "doctor",
        HospitalUuid: HOSPITAL_UUID,
        DoctorUuid: DOCTOR_UUID,
        PatientName: "Test",
        Gender: "Male",
        Phone: "0987654321",
        Birthdate: "1990-01-15",
        MedicalCode: "KH-X",
        Note: "",
        AppointmentAt: "2020-01-01T09:00:00+07:00",
      },
      { headers: { "X-Mock-Account-Uuid": STAFF_UUID } },
    ),
    422,
  );

  console.log("\n=== Test 8: Walk-in type=medical-service ===");
  await expect(
    "POST walk-in service",
    client.post(
      "/appointments/walk-in",
      {
        Type: "medical-service",
        HospitalUuid: HOSPITAL_UUID,
        MedicalServiceUuid: SERVICE_UUID,
        PatientName: "Khách dịch vụ",
        Gender: "Female",
        Phone: "0935111222",
        Birthdate: "1985-05-20",
        MedicalCode: "KH-220003",
        Note: "",
        AppointmentAt: "2026-10-07T08:00:00+07:00",
      },
      { headers: { "X-Mock-Account-Uuid": STAFF_UUID } },
    ),
  );

  console.log("\n=== Test 9: Walk-in type=hospital ===");
  await expect(
    "POST walk-in hospital",
    client.post(
      "/appointments/walk-in",
      {
        Type: "hospital",
        HospitalUuid: HOSPITAL_UUID,
        PatientName: "Khách BV",
        Gender: "Male",
        Phone: "0935333444",
        Birthdate: "1970-12-31",
        MedicalCode: "KH-220004",
        Note: "Đến trực tiếp không hẹn trước",
        AppointmentAt: "2026-10-08T10:00:00+07:00",
      },
      { headers: { "X-Mock-Account-Uuid": STAFF_UUID } },
    ),
  );

  console.log("\n=== Test 10: GET /appointments của PATIENT vẫn hoạt động bình thường ===");
  await expect(
    "GET appointments as patient",
    client.get("/appointments", {
      headers: { "X-Mock-Account-Uuid": PATIENT_UUID },
      params: { accountUuid: PATIENT_UUID },
    }),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});