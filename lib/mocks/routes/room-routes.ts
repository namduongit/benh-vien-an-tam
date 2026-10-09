import type AxiosMockAdapter from "axios-mock-adapter";

import { mockHospitals } from "@/data/mocks/hospitals";
import { mockRooms } from "@/data/mocks/rooms";
import { getPositiveIntegerParam, getStringParam } from "@/lib/mocks/query-utils";
import { RoomStatus, type Room } from "@/types/models";

type RoomCreatePayload = {
  name?: unknown;
  status?: unknown;
};

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
    const page = getPositiveIntegerParam(config.params, "page", 1);
    const pageSize = Math.min(
      getPositiveIntegerParam(config.params, "pageSize", 20),
      100,
    );
    const filtered = rooms
      .filter(
        (room) =>
          room.HospitalUuid === hospitalUuid &&
          room.DeletedAt.getTime() === 0 &&
          (!status || room.Status === status),
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
    if (!hospitalExists(hospitalUuid)) return notFound("Hospital not found");

    const request = parsePayload(config.data);
    if (!isValidRoomPayload(request, true)) {
      return [400, { message: "Room name must contain 1 to 100 characters." }];
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

      room.DeletedAt = new Date();
      room.UpdatedAt = new Date();
      return [204];
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
    value.status === undefined ||
    Object.values(RoomStatus).includes(value.status as RoomStatus);

  return (requireName ? hasValidName : value.name === undefined || hasValidName) &&
    hasValidStatus;
}

function toRoomDto(room: Room) {
  return {
    uuid: room.Uuid,
    name: room.Name,
    status: room.Status,
    hospitalUuid: room.HospitalUuid,
    createdAt: room.CreatedAt.toISOString(),
    updatedAt: room.UpdatedAt.toISOString(),
  };
}

function notFound(
  message: string,
): [number, { message: string; error: string }] {
  return [404, { message, error: "Resource does not exist" }];
}
