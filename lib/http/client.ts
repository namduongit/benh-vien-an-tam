import axios from "axios";

import { attachMockApi } from "@/lib/http/mock-api";

export const httpClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api",
  timeout: 10_000,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

httpClient.interceptors.response.use((response) => {
  const body = response.data;

  if (body && typeof body === "object" && !Array.isArray(body)) {
    const payload = body as Record<string, unknown>;

    if (!("Data" in payload) && "data" in payload) {
      payload.Data = payload.data;
    }
    if (!("Message" in payload) && "message" in payload) {
      payload.Message = payload.message;
    }
  }

  return response;
});

if (process.env.NEXT_PUBLIC_USE_MOCK_API !== "false") {
  attachMockApi(httpClient);
}
