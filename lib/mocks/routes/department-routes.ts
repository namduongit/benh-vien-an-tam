import type AxiosMockAdapter from "axios-mock-adapter";

import { featuredDepartments, mockDepartments } from "@/data/mocks/departments";
import {
  getPositiveIntegerParam,
  getStringParam,
  matchesKeyword,
  paginate,
} from "@/lib/mocks/query-utils";
import { BaseStatus } from "@/types/models";

export function registerDepartmentRoutes(mock: AxiosMockAdapter) {
  mock.onGet("/departments").reply((config) => {
    const search =
      getStringParam(config.params, "search") ||
      getStringParam(config.params, "q");
    const page = getPositiveIntegerParam(config.params, "page", 1);
    const pageSize = getPositiveIntegerParam(config.params, "pageSize", 20);
    const items = mockDepartments.filter(
      (department) =>
        department.Status === BaseStatus.Active &&
        matchesKeyword(search, department.Name, department.Slug),
    );

    return [
      200,
      {
        Data: paginate(items, page, pageSize),
        Message: "Lấy danh sách chuyên khoa thành công.",
      },
    ];
  });

  mock.onGet("/departments/featured").reply(200, {
    Data: featuredDepartments,
    Message: "Lấy danh sách chuyên khoa nổi bật thành công.",
  });

  mock.onGet("/departments/options").reply(200, {
    Data: mockDepartments.filter(
      (department) => department.Status === BaseStatus.Active,
    ),
    Message: "Lấy lựa chọn chuyên khoa thành công.",
  });
}
