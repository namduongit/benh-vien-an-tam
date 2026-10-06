// Verify TimeWorking logic từ quan hệ n-n
import { mockDoctorWorkings } from "../data/mocks/doctor-workings";
import { mockHospitalWorkings } from "../data/mocks/hospital-workings";
import { mockServiceWorkings } from "../data/mocks/service-workings";
import { mockTimeWorkings } from "../data/mocks/time-workings";
import { BaseStatus } from "../types/models";

// Reproduce helpers
function getActiveTimeWorkings() {
  return mockTimeWorkings.filter((item) => item.Status === BaseStatus.Active);
}

function getHospitalTimeWorkings(hospitalUuid: string) {
  const workingUuids = new Set(
    mockHospitalWorkings
      .filter((item) => item.HospitalUuid === hospitalUuid)
      .map((item) => item.WorkingUuid),
  );
  return getActiveTimeWorkings().filter((item) => workingUuids.has(item.Uuid));
}

function getDoctorTimeWorkings(doctorUuid: string) {
  const workingUuids = new Set(
    mockDoctorWorkings
      .filter((item) => item.DoctorUuid === doctorUuid)
      .map((item) => item.WorkingUuid),
  );
  return getActiveTimeWorkings().filter((item) => workingUuids.has(item.Uuid));
}

function getServiceTimeWorkings(serviceUuid: string) {
  const workingUuids = new Set(
    mockServiceWorkings
      .filter((item) => item.ServiceUuid === serviceUuid)
      .map((item) => item.WorkingUuid),
  );
  return getActiveTimeWorkings().filter((item) => workingUuids.has(item.Uuid));
}

function intersectTimeWorkings<T extends { Uuid: string }>(first: T[], second: T[]) {
  const secondUuids = new Set(second.map((item) => item.Uuid));
  return first.filter((item) => secondUuids.has(item.Uuid));
}

function getWeekdayFromDate(date: string): number | null {
  const value = new Date(`${date}T12:00:00+07:00`);
  return Number.isNaN(value.getTime()) ? null : value.getUTCDay();
}

function parseTimeMinutes(value: string): number | null {
  const [hour, minute] = value.split(":").map(Number);
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) return null;
  return hour * 60 + minute;
}

function formatMinutesFromValue(value: number): string {
  const hour = Math.floor(value / 60).toString().padStart(2, "0");
  const minute = (value % 60).toString().padStart(2, "0");
  return `${hour}:${minute}`;
}

function createSlotTimesFromWorkings(date: string, workings: any[]): string[] {
  const dayOfWeek = getWeekdayFromDate(date);
  if (dayOfWeek === null) return [];
  const slots = new Set<string>();
  for (const working of workings) {
    if (working.DayOfWeek !== dayOfWeek) continue;
    const startMinutes = parseTimeMinutes(working.StartTime);
    const endMinutes = parseTimeMinutes(working.EndTime);
    if (startMinutes === null || endMinutes === null || startMinutes >= endMinutes) continue;
    for (let minutes = startMinutes; minutes < endMinutes; minutes += 60) {
      slots.add(formatMinutesFromValue(minutes));
    }
  }
  return [...slots].sort();
}

function formatWorkingHourFromWorkings(date: string, workings: any[]) {
  const dayOfWeek = getWeekdayFromDate(date);
  if (dayOfWeek === null) return "Chưa có lịch";
  const ranges = workings
    .filter((item) => item.DayOfWeek === dayOfWeek)
    .map((item) => `${item.StartTime} - ${item.EndTime}`);
  if (!ranges.length) return "Chưa có lịch";
  return [...new Set(ranges)].sort().join(", ");
}

// ==== TEST ====
console.log("Total mockTimeWorkings:", mockTimeWorkings.length);
console.log("Total mockHospitalWorkings:", mockHospitalWorkings.length);
console.log("Total mockDoctorWorkings:", mockDoctorWorkings.length);
console.log("Total mockServiceWorkings:", mockServiceWorkings.length);

// Hospital An Bình (a4a0a61f)
const HOSPITAL_AB = "a4a0a61f-577d-48cb-94b9-c9ce85554b11";
const hospitalWorkings = getHospitalTimeWorkings(HOSPITAL_AB);
console.log("\n[HOSPITAL] Bệnh viện An Bình có", hospitalWorkings.length, "TimeWorking");
console.log("  DayOfWeek breakdown:", [1,2,3,4,5,6].map(d => `${d}=${hospitalWorkings.filter(w=>w.DayOfWeek===d).length}`).join(" "));

// BS Nguyễn Minh Khoa (57479ec8)
const DOCTOR_KHOA = "57479ec8-29e0-44af-a8b0-15041655c5b8";
const doctorWorkings = getDoctorTimeWorkings(DOCTOR_KHOA);
console.log("\n[DOCTOR] BS Nguyễn Minh Khoa có", doctorWorkings.length, "TimeWorking");
console.log("  DayOfWeek breakdown:", [1,2,3,4,5,6].map(d => `${d}=${doctorWorkings.filter(w=>w.DayOfWeek===d).length}`).join(" "));

const doctorBookings = intersectTimeWorkings(doctorWorkings, hospitalWorkings);
console.log("  Sau intersect với Hospital:", doctorBookings.length);

// Service (lấy service đầu tiên)
const FIRST_SERVICE = mockServiceWorkings[0]?.ServiceUuid;
console.log("\n[SERVICE] First service Uuid:", FIRST_SERVICE);
const serviceWorkings = getServiceTimeWorkings(FIRST_SERVICE!);
console.log("  Có", serviceWorkings.length, "TimeWorking");
console.log("  DayOfWeek breakdown:", [1,2,3,4,5,6].map(d => `${d}=${serviceWorkings.filter(w=>w.DayOfWeek===d).length}`).join(" "));

const serviceBookings = intersectTimeWorkings(serviceWorkings, hospitalWorkings);
console.log("  Sau intersect với Hospital:", serviceBookings.length);

// === Test slot cho một ngày cụ thể ===
// Thứ Hai = dayOfWeek 1
const testDate = "2026-10-05"; // T2
console.log("\n[SLOT] Ngày", testDate, "dayOfWeek =", getWeekdayFromDate(testDate));

console.log("  Hospital slots:", createSlotTimesFromWorkings(testDate, hospitalWorkings));
console.log("  Doctor slots:", createSlotTimesFromWorkings(testDate, doctorBookings));
console.log("  Service slots:", createSlotTimesFromWorkings(testDate, serviceBookings));

console.log("  Hospital workingHour display:", formatWorkingHourFromWorkings(testDate, hospitalWorkings));
console.log("  Doctor workingHour display:", formatWorkingHourFromWorkings(testDate, doctorBookings));
console.log("  Service workingHour display:", formatWorkingHourFromWorkings(testDate, serviceBookings));

// Test Chủ Nhật (không có TimeWorking)
const testSunday = "2026-10-04"; // CN
console.log("\n[SUNDAY] Ngày", testSunday, "dayOfWeek =", getWeekdayFromDate(testSunday));
console.log("  Hospital slots:", createSlotTimesFromWorkings(testSunday, hospitalWorkings));
console.log("  Hospital workingHour:", formatWorkingHourFromWorkings(testSunday, hospitalWorkings));

// Test Thứ Bảy
const testSat = "2026-10-10"; // T7
console.log("\n[SATURDAY] Ngày", testSat, "dayOfWeek =", getWeekdayFromDate(testSat));
console.log("  Hospital slots:", createSlotTimesFromWorkings(testSat, hospitalWorkings));
console.log("  Doctor slots (should be empty, doctor không có T7):", createSlotTimesFromWorkings(testSat, doctorBookings));