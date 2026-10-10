export type ApiResponse<T> = {
  Data: T;
  data?: T;
  Message: string;
  message?: string;
};

export type PaginatedData<T> = {
  Items: T[];
  Page: number;
  PageSize: number;
  TotalItems: number;
  TotalPages: number;
};

export type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; message: string };
