import {
  AppointmentMedicalServiceStatus,
  type AppointmentMedicalService,
} from "@/types/models";

export const mockAppointmentMedicalServices: AppointmentMedicalService[] = [
  {
    Uuid: "8e29df7b-900c-4e82-aee6-7fef0d5d1101",
    AppointmentUuid: "b403f8b3-05aa-4368-a65f-fc57985c5103",
    MedicalServiceUuid: "6fb2fb37-cf96-4926-b66a-bf81cce5ecb3",
    Price: 180000,
    Description: "Chỉ số đường huyết trong giới hạn theo dõi.",
    Status: AppointmentMedicalServiceStatus.Completed,
  },
];
