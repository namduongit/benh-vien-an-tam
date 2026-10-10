import type AxiosMockAdapter from "axios-mock-adapter";

import { mockHospitals } from "@/data/mocks/hospitals";
import {
  featuredMedicalServices,
  mockMedicalServices,
} from "@/data/mocks/medical-services";
import { mockReviewMedicalServices } from "@/data/mocks/review-medical-services";
import { getHospitalAssignments } from "@/lib/mocks/hospital-assignments";
import {
  getPositiveIntegerParam,
  getStringParam,
  matchesKeyword,
  paginate,
} from "@/lib/mocks/query-utils";
import { BaseStatus } from "@/types/models";

export function registerMedicalServiceRoutes(mock: AxiosMockAdapter) {
  mock.onGet("/medical-services/featured").reply(200, {
    Data: featuredMedicalServices,
    Message: "Lấy danh sách dịch vụ nổi bật thành công.",
  });

  mock.onGet("/medical-services").reply((config) => {
    const q = getStringParam(config.params, "q");
    const hospital = getStringParam(config.params, "hospital");
    const page = getPositiveIntegerParam(config.params, "page", 1);
    const pageSize = getPositiveIntegerParam(config.params, "pageSize", 6);
    const items = mockMedicalServices.filter(
      (service) =>
        service.Status === BaseStatus.Active &&
        matchesKeyword(
          getStringParam(config.params, "search") || q,
          service.Name,
          service.Description,
        ) &&
        (!hospital ||
          getHospitalAssignments(hospital).MedicalServiceUuids.includes(
            service.Uuid,
          )),
    );

    return [
      200,
      {
        Data: paginate(items, page, pageSize),
        Message: "Lấy danh sách dịch vụ y tế thành công.",
      },
    ];
  });

  mock
    .onGet(/^\/medical-services\/(?!featured$)[^/]+$/)
    .reply((config) => {
      const slug = decodeURIComponent(config.url?.split("/").pop() ?? "");
      const service = mockMedicalServices.find(
        (item) => item.Slug === slug && item.Status === BaseStatus.Active,
      );

      if (!service) {
        return [404, { Data: null, Message: "Không tìm thấy dịch vụ y tế." }];
      }

      const hospitalUuids = new Set(
        mockHospitals
          .filter(
            (hospital) =>
              hospital.Status === BaseStatus.Active &&
              getHospitalAssignments(hospital.Uuid).MedicalServiceUuids.includes(
                service.Uuid,
              ),
          )
          .map((hospital) => hospital.Uuid),
      );

      return [
        200,
        {
          Data: {
            MedicalService: service,
            Hospitals: mockHospitals.filter(
              (item) =>
                item.Status === BaseStatus.Active && hospitalUuids.has(item.Uuid),
            ),
            Reviews: mockReviewMedicalServices
              .filter(
                (review) =>
                  review.MedicalServiceUuid === service.Uuid &&
                  review.Status === BaseStatus.Active,
              )
              .sort((a, b) => b.CreatedAt.getTime() - a.CreatedAt.getTime()),
          },
          Message: "Lấy chi tiết dịch vụ y tế thành công.",
        },
      ];
    });
}
