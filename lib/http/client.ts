import axios, { type InternalAxiosRequestConfig } from "axios";

import { attachMockApi } from "@/lib/http/mock-api";

export const httpClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api",
  withCredentials: true,
  timeout: 10_000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

if (process.env.NEXT_PUBLIC_USE_MOCK_API !== "false") {
  attachMockApi(httpClient);
} else {
  type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean };
  let refreshRequest: Promise<void> | null = null;

  httpClient.interceptors.response.use(undefined, async (error) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const request = error.config as RetryableRequest | undefined;
    const url = request?.url ?? "";
    if (
      !request ||
      request._retry ||
      url.includes("/auth/login") ||
      url.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    request._retry = true;
    refreshRequest ??= httpClient
      .post("/auth/refresh")
      .then(() => undefined)
      .finally(() => {
        refreshRequest = null;
      });

    await refreshRequest;
    return httpClient(request);
  });
}
