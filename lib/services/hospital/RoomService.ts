import { httpClient } from "@/lib/http/client";
import type { ApiResponse, PaginatedData } from "@/lib/http/response";
import { RoomStatus, type Guid, type Room } from "@/types/models";

export type RoomListQuery = {
  page?: number;
  pageSize?: number;
  status?: RoomStatus;
};

export type CreateRoomRequest = {
  Name: string;
  Status?: RoomStatus;
};

export type UpdateRoomRequest = {
  Name: string;
  Status?: RoomStatus;
};

type RoomApiDto = {
  uuid: Guid;
  name: string;
  status: RoomStatus;
  hospitalUuid: Guid | null;
  createdAt: string;
  updatedAt: string;
};

type RoomListApiResponse = {
  message: string;
  data: RoomApiDto[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
};

type RoomApiResponse = {
  message: string;
  data: RoomApiDto;
};

export class RoomService {
  async getAll(
    hospitalUuid: Guid,
    query: RoomListQuery = {},
    signal?: AbortSignal,
  ): Promise<ApiResponse<PaginatedData<Room>>> {
    const response = await httpClient.get<RoomListApiResponse>(
      `/hospitals/${encodeURIComponent(hospitalUuid)}/rooms`,
      { params: query, signal },
    );

    return {
      Message: response.data.message,
      Data: {
        Items: response.data.data.map((room) =>
          toRoom(room, hospitalUuid),
        ),
        Page: response.data.pagination.page,
        PageSize: response.data.pagination.pageSize,
        TotalItems: response.data.pagination.totalCount,
        TotalPages: response.data.pagination.totalPages,
      },
    };
  }

  async getByUuid(
    hospitalUuid: Guid,
    roomUuid: Guid,
  ): Promise<ApiResponse<Room>> {
    const response = await httpClient.get<RoomApiResponse>(
      `/hospitals/${encodeURIComponent(hospitalUuid)}/rooms/${encodeURIComponent(roomUuid)}`,
    );

    return {
      Message: response.data.message,
      Data: toRoom(response.data.data, hospitalUuid),
    };
  }

  async create(
    hospitalUuid: Guid,
    request: CreateRoomRequest,
  ): Promise<ApiResponse<Room>> {
    const response = await httpClient.post<RoomApiResponse>(
      `/hospitals/${encodeURIComponent(hospitalUuid)}/rooms`,
      {
        name: request.Name,
        status: request.Status,
      },
    );

    return {
      Message: response.data.message,
      Data: toRoom(response.data.data, hospitalUuid),
    };
  }

  async update(
    hospitalUuid: Guid,
    roomUuid: Guid,
    request: UpdateRoomRequest,
  ): Promise<ApiResponse<Room>> {
    const response = await httpClient.put<RoomApiResponse>(
      `/hospitals/${encodeURIComponent(hospitalUuid)}/rooms/${encodeURIComponent(roomUuid)}`,
      {
        name: request.Name,
        status: request.Status,
      },
    );

    return {
      Message: response.data.message,
      Data: toRoom(response.data.data, hospitalUuid),
    };
  }

  async delete(hospitalUuid: Guid, roomUuid: Guid): Promise<void> {
    await httpClient.delete(
      `/hospitals/${encodeURIComponent(hospitalUuid)}/rooms/${encodeURIComponent(roomUuid)}`,
    );
  }
}

function toRoom(room: RoomApiDto, hospitalUuid: Guid): Room {
  return {
    Uuid: room.uuid,
    Name: room.name,
    Status: room.status,
    HospitalUuid: room.hospitalUuid ?? hospitalUuid,
    CreatedAt: new Date(room.createdAt),
    UpdatedAt: new Date(room.updatedAt),
    DeletedAt: new Date(0),
  };
}

export const roomService = new RoomService();
