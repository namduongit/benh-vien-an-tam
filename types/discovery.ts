import type { Guid } from "@/types/models";

export type PaginationQuery = {
  q?: string;
  page?: number;
  pageSize?: number;
};

export type HospitalListQuery = PaginationQuery & {
  department?: Guid;
  name?: string;
};

export type DoctorListQuery = PaginationQuery & {
  hospital?: Guid;
  department?: Guid;
};

export type MedicalServiceListQuery = PaginationQuery & {
  hospital?: Guid;
  search?: string;
};
