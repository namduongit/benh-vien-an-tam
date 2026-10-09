import type AxiosMockAdapter from "axios-mock-adapter";

import { mockHospitals } from "@/data/mocks/hospitals";
import { mockAppointments } from "@/data/mocks/appointments";
import { mockRooms } from "@/data/mocks/rooms";
import {
  getPositiveIntegerParam,
  getStringParam,
  matchesKeyword,
} from "@/lib/mocks/query-utils";
import {
  AppointmentStatus,
  RoomStatus,
  type Room,
} from "@/types/models";

type RoomCreatePayload = {
  name?: unknown;
  status?: unknown;
};

type RoomQueryParams = Record<string, unknown> | undefined;

const rooms: Room[] = mockRooms.map((room) => ({
  ...room,
  CreatedAt: new Date(room.CreatedAt.getTime()),
  UpdatedAt: new Date(room.UpdatedAt.getTime()),
  DeletedAt: new Date(room.DeletedAt.getTime()),
}));

export function registerRoomRoutes(mock: AxiosMockAdapter) {
  mock.onGet(/^\/hospitals\/[^/]+\/rooms$/).reply((config) => {
    const hospitalUuid = getHospitalUuid(config.url);
    if (!hospitalExists(hospitalUuid)) return notFound("Hospital not found");

    const status = getStringParam(config.params, "status");
    const search = getStringParam(config.params, "search");
    const rawIncludeDeleted = config.params?.includeDeleted;
    if (
      rawIncludeDeleted !== undefined &&
      rawIncludeDeleted !== true &&
      rawIncludeDeleted !== false &&
      rawIncludeDeleted !== "true" &&
      rawIncludeDeleted !== "false"
    ) {
      return [400, { message: "includeDeleted must be true or false." }];
    }
    if (status && !isRoomStatus(status)) {
      return [400, { message: "Room status is invalid." }];
    }
    const includeDeleted = getBooleanParam(config.params, "includeDeleted");
    const page = getPositiveIntegerParam(config.params, "page", 1);
    const pageSize = Math.min(
      getPositiveIntegerParam(config.params, "pageSize", 20),
      100,
    );
    const filtered = rooms
      .filter(
        (room) =>
          room.HospitalUuid === hospitalUuid &&
          (includeDeleted || room.DeletedAt.getTime() === 0) &&
          (!status || room.Status === status) &&
          matchesKeyword(search, room.Name, room.Uuid),
      )
      .sort((left, right) => right.CreatedAt.getTime() - left.CreatedAt.getTime());
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const items = filtered.slice((page - 1) * pageSize, page * pageSize);

    return [
      200,
      {
        message: "Fetched successfully",
        data: items.map(toRoomDto),
        pagination: { page, pageSize, totalCount, totalPages },
      },
    ];
  });

  mock
    .onGet(/^\/hospitals\/[^/]+\/rooms\/[^/]+$/)
    .reply((config) => {
      const [hospitalUuid, roomUuid] = getRoomRouteIds(config.url);
      const room = rooms.find(
        (item) =>
          item.Uuid === roomUuid &&
          item.HospitalUuid === hospitalUuid &&
          item.DeletedAt.getTime() === 0,
      );

      return room
        ? [200, { message: "Fetched successfully", data: toRoomDto(room) }]
        : notFound("Room not found");
    });

  mock.onPost(/^\/hospitals\/[^/]+\/rooms$/).reply((config) => {
    const hospitalUuid = getHospitalUuid(config.url);
    const hospital = mockHospitals.find(
      (item) => item.Uuid === hospitalUuid && item.DeletedAt.getTime() === 0,
    );
    if (!hospital) return notFound("Hospital not found");

    const request = parsePayload(config.data);
    if (!isValidRoomPayload(request, true)) {
      return [400, { message: "Room name must contain 1 to 100 characters." }];
    }

    if (getActiveRoomCount(hospitalUuid) >= hospital.NumberOfRoom) {
      return capacityConflict();
    }

    const now = new Date();
    const room: Room = {
      Uuid: crypto.randomUUID(),
      Name: request.name.trim(),
      Status: request.status ?? RoomStatus.Available,
      HospitalUuid: hospitalUuid,
      CreatedAt: now,
      UpdatedAt: now,
      DeletedAt: new Date(0),
    };
    rooms.push(room);

    return [
      201,
      { message: "Created successfully", data: toRoomDto(room) },
    ];
  });

  mock
    .onPut(/^\/hospitals\/[^/]+\/rooms\/[^/]+$/)
    .reply((config) => {
      const [hospitalUuid, roomUuid] = getRoomRouteIds(config.url);
      const room = rooms.find(
        (item) =>
          item.Uuid === roomUuid &&
          item.HospitalUuid === hospitalUuid &&
          item.DeletedAt.getTime() === 0,
      );

      if (!room) return notFound("Room not found");

      const request = parsePayload(config.data);
      if (!isValidRoomPayload(request, false)) {
        return [400, { message: "Room name must contain 1 to 100 characters." }];
      }

      if (request.status === RoomStatus.Maintenance) {
        const hasActiveAppointments = mockAppointments.some(
          (appointment) =>
            appointment.RoomUuid === roomUuid &&
            appointment.HospitalUuid === hospitalUuid &&
            appointment.DeletedAt.getTime() === 0 &&
            (appointment.Status === AppointmentStatus.Pending ||
              appointment.Status === AppointmentStatus.Approved),
        );
        if (hasActiveAppointments) return appointmentConflict();
      }

      if (typeof request.name === "string") room.Name = request.name.trim();
      if (request.status) room.Status = request.status;
      room.UpdatedAt = new Date();

      return [
        200,
        { message: "Updated successfully", data: toRoomDto(room) },
      ];
    });

  mock
    .onDelete(/^\/hospitals\/[^/]+\/rooms\/[^/]+$/)
    .reply((config) => {
      const [hospitalUuid, roomUuid] = getRoomRouteIds(config.url);
      const room = rooms.find(
        (item) =>
          item.Uuid === roomUuid &&
          item.HospitalUuid === hospitalUuid &&
          item.DeletedAt.getTime() === 0,
      );

      if (!room) return notFound("Room not found");

      const hasActiveAppointments = mockAppointments.some(
        (appointment) =>
          appointment.RoomUuid === roomUuid &&
          appointment.HospitalUuid === hospitalUuid &&
          appointment.DeletedAt.getTime() === 0 &&
          (appointment.Status === AppointmentStatus.Pending ||
            appointment.Status === AppointmentStatus.Approved),
      );
      if (hasActiveAppointments) return appointmentConflict();

      room.DeletedAt = new Date();
      room.UpdatedAt = new Date();
      return [204];
    });

  mock
    .onPost(/^\/hospitals\/[^/]+\/rooms\/[^/]+\/restore$/)
    .reply((config) => {
      const [hospitalUuid, roomUuid] = getRoomRouteIds(config.url);
      const hospital = mockHospitals.find(
        (item) => item.Uuid === hospitalUuid && item.DeletedAt.getTime() === 0,
      );
      if (!hospital) return notFound("Hospital not found");

      const room = rooms.find(
        (item) =>
          item.Uuid === roomUuid &&
          item.HospitalUuid === hospitalUuid &&
          item.DeletedAt.getTime() !== 0,
      );
      if (!room) return notFound("Deleted room not found");
      if (getActiveRoomCount(hospitalUuid) >= hospital.NumberOfRoom) {
        return capacityConflict();
      }

      room.DeletedAt = new Date(0);
      room.UpdatedAt = new Date();

      return [
        200,
        {
          message: "Room restored successfully",
          data: toRoomDto(room),
        },
      ];
    });
}

function getHospitalUuid(url?: string) {
  return decodeURIComponent(url?.split("/")[2] ?? "");
}

function getRoomRouteIds(url?: string) {
  const parts = url?.split("/") ?? [];
  return [
    decodeURIComponent(parts[2] ?? ""),
    decodeURIComponent(parts[4] ?? ""),
  ];
}

function hospitalExists(uuid: string) {
  return mockHospitals.some(
    (hospital) =>
      hospital.Uuid === uuid && hospital.DeletedAt.getTime() === 0,
  );
}

function getActiveRoomCount(hospitalUuid: string) {
  return rooms.filter(
    (room) =>
      room.HospitalUuid === hospitalUuid && room.DeletedAt.getTime() === 0,
  ).length;
}

function getBooleanParam(params: RoomQueryParams, key: string) {
  const value = params?.[key];
  return value === true || value === "true";
}

function parsePayload(data: unknown): RoomCreatePayload {
  return (typeof data === "string" ? JSON.parse(data) : data) as RoomCreatePayload;
}

function isValidRoomPayload(
  value: RoomCreatePayload,
  requireName: true,
): value is RoomCreatePayload & { name: string; status?: RoomStatus };
function isValidRoomPayload(
  value: RoomCreatePayload,
  requireName: false,
): value is RoomCreatePayload & { name?: string; status?: RoomStatus };
function isValidRoomPayload(
  value: RoomCreatePayload,
  requireName: boolean,
): value is RoomCreatePayload & { name?: string; status?: RoomStatus } {
  if (!value || typeof value !== "object") return false;

  const hasValidName =
    typeof value.name === "string" &&
    value.name.trim().length >= 1 &&
    value.name.trim().length <= 100;
  const hasValidStatus =
    value.status === undefined || isRoomStatus(value.status);

  return (requireName ? hasValidName : value.name === undefined || hasValidName) &&
    hasValidStatus;
}

function isRoomStatus(value: unknown): value is RoomStatus {
  return (
    typeof value === "string" &&
    Object.values(RoomStatus).some((status) => status === value)
  );
}

function toRoomDto(room: Room) {
  return {
    uuid: room.Uuid,
    name: room.Name,
    status: room.Status,
    hospitalUuid: room.HospitalUuid,
    createdAt: room.CreatedAt.toISOString(),
    updatedAt: room.UpdatedAt.toISOString(),
    deletedAt:
      room.DeletedAt.getTime() === 0 ? null : room.DeletedAt.toISOString(),
  };
}

function notFound(
  message: string,
): [number, { message: string; error: string }] {
  return [404, { message, error: "Resource does not exist" }];
}

function capacityConflict(): [number, { message: string; error: string }] {
  return [
    409,
    {
      message: "Hospital room capacity reached",
      error: "ROOM_CAPACITY_REACHED",
    },
  ];
}

function appointmentConflict(): [number, { message: string; error: string }] {
  return [
    409,
    {
      message: "Room has pending or approved appointments",
      error: "ROOM_HAS_ACTIVE_APPOINTMENTS",
    },
  ];
}
