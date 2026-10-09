import type { AxiosInstance } from "axios";
import AxiosMockAdapter from "axios-mock-adapter";

import { registerAuthRoutes } from "@/lib/mocks/routes/auth-routes";
import { registerAppointmentRoutes } from "@/lib/mocks/routes/appointment-routes";
import { registerBranchAppointmentRoutes } from "@/lib/mocks/routes/branch-appointment-routes";
import { registerDepartmentRoutes } from "@/lib/mocks/routes/department-routes";
import { registerDoctorRoutes } from "@/lib/mocks/routes/doctor-routes";
import { registerDoctorProfileRoutes } from "@/lib/mocks/routes/doctor-profile-routes";
import { registerAvailableMedicineRoutes } from "@/lib/mocks/routes/available-medicine-routes";
import { registerHospitalRoutes } from "@/lib/mocks/routes/hospital-routes";
import { registerInternalClinicalRoutes } from "@/lib/mocks/routes/internal-clinical-routes";
import { registerMedicalServiceRoutes } from "@/lib/mocks/routes/medical-service-routes";
import { registerPatientRoutes } from "@/lib/mocks/routes/patient-routes";
import { registerPrescriptionRoutes } from "@/lib/mocks/routes/prescription-routes";
import { registerReviewRoutes } from "@/lib/mocks/routes/review-routes";
import { registerRoomRoutes } from "@/lib/mocks/routes/room-routes";
import { registerStaffRoutes } from "@/lib/mocks/routes/staff-routes";

export function attachMockApi(client: AxiosInstance) {
  const mock = new AxiosMockAdapter(client, {
    delayResponse: 250,
    onNoMatch: "throwException",
  });

  registerAuthRoutes(mock);
  registerAppointmentRoutes(mock);
  registerBranchAppointmentRoutes(mock);
  registerDepartmentRoutes(mock);
  registerHospitalRoutes(mock);
  registerInternalClinicalRoutes(mock);
  registerDoctorRoutes(mock);
  registerDoctorProfileRoutes(mock);
  registerAvailableMedicineRoutes(mock);
  registerMedicalServiceRoutes(mock);
  registerPatientRoutes(mock);
  registerPrescriptionRoutes(mock);
  registerReviewRoutes(mock);
  registerRoomRoutes(mock);
  registerStaffRoutes(mock);

  return mock;
}
