import type { Room } from "@/lib/roomData";

export interface RoomRequirements {
  attendees: number;
  equipment: string[];
}

export function parseAttendees(raw: string): number {
  return raw.trim() === "" ? Number.NaN : Number(raw);
}

export function isValidAttendeeCount(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

export function filterRooms(rooms: Room[], requirements: RoomRequirements): Room[] {
  if (!isValidAttendeeCount(requirements.attendees)) return [];

  return rooms.filter(
    (room) =>
      room.capacity >= requirements.attendees &&
      requirements.equipment.every((item) => room.equipment.includes(item))
  );
}

export function getEquipmentOptions(rooms: Room[]): string[] {
  return [...new Set(rooms.flatMap((room) => room.equipment))].sort();
}

export function resolveSelectedRoom(matches: Room[], selectedRoomId: string | null): Room | null {
  return matches.find((room) => room.id === selectedRoomId) ?? matches[0] ?? null;
}
