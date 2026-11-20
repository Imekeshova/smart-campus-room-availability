import { describe, expect, test } from "vitest";
import { checkAvailability } from "@/lib/availability";
import { ROOMS, type Room } from "@/lib/roomData";
import {
  filterRooms,
  getEquipmentOptions,
  parseAttendees,
  resolveSelectedRoom,
} from "@/lib/roomFiltering";

const ids = (rooms: Room[]) => rooms.map((room) => room.id);

describe("filterRooms", () => {
  test("default filters return all four rooms", () => {
    expect(ids(filterRooms(ROOMS, { attendees: 1, equipment: [] }))).toEqual([
      "nova-s201",
      "cedar-c314",
      "zenith-z105",
      "orion-o202",
    ]);
  });

  test("matches a room whose capacity equals the attendee count", () => {
    expect(ids(filterRooms(ROOMS, { attendees: 12, equipment: [] }))).toContain("cedar-c314");
  });

  test("excludes a room whose capacity is below the attendee count", () => {
    expect(ids(filterRooms(ROOMS, { attendees: 13, equipment: [] }))).not.toContain("cedar-c314");
  });

  test("requires every selected equipment item", () => {
    expect(
      ids(filterRooms(ROOMS, { attendees: 1, equipment: ["projector", "whiteboard"] }))
    ).toEqual(["cedar-c314", "orion-o202"]);
  });

  test("returns no rooms when no room has all selected equipment", () => {
    expect(
      filterRooms(ROOMS, { attendees: 1, equipment: ["computers", "speakers"] })
    ).toEqual([]);
  });

  test("returns no rooms when attendees exceed every capacity", () => {
    expect(filterRooms(ROOMS, { attendees: 25, equipment: [] })).toEqual([]);
  });

  test("rejects invalid attendee values", () => {
    for (const attendees of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(filterRooms(ROOMS, { attendees, equipment: [] })).toEqual([]);
    }
  });

  test("rejects an empty attendee input", () => {
    expect(filterRooms(ROOMS, { attendees: parseAttendees(""), equipment: [] })).toEqual([]);
    expect(filterRooms(ROOMS, { attendees: parseAttendees("   "), equipment: [] })).toEqual([]);
  });

  test("does not mutate the catalog or filter inputs", () => {
    const catalogBefore = structuredClone(ROOMS);
    const requirements = { attendees: 12, equipment: ["projector", "whiteboard"] };
    const requirementsBefore = structuredClone(requirements);

    filterRooms(ROOMS, requirements);

    expect(ROOMS).toEqual(catalogBefore);
    expect(requirements).toEqual(requirementsBefore);
  });
});

describe("getEquipmentOptions", () => {
  test("lists each catalog equipment item once, alphabetically", () => {
    expect(getEquipmentOptions(ROOMS)).toEqual([
      "computers",
      "projector",
      "speakers",
      "whiteboard",
      "wifi",
    ]);
  });
});

describe("resolveSelectedRoom", () => {
  test("keeps the selected room when it still matches", () => {
    const matches = filterRooms(ROOMS, { attendees: 1, equipment: [] });
    expect(resolveSelectedRoom(matches, "cedar-c314")?.id).toBe("cedar-c314");
  });

  test("moves to the first matching room when the previous room is excluded", () => {
    const matches = filterRooms(ROOMS, { attendees: 12, equipment: ["projector", "whiteboard"] });
    expect(resolveSelectedRoom(matches, "nova-s201")?.id).toBe("cedar-c314");
  });

  test("selects the first match when no room was selected", () => {
    const matches = filterRooms(ROOMS, { attendees: 1, equipment: [] });
    expect(resolveSelectedRoom(matches, null)?.id).toBe("nova-s201");
  });

  test("returns null when there are no matches", () => {
    const matches = filterRooms(ROOMS, { attendees: 25, equipment: [] });
    expect(resolveSelectedRoom(matches, "cedar-c314")).toBeNull();
  });
});

describe("filtering combined with availability", () => {
  test("a matching blocked room remains unavailable", () => {
    const matches = filterRooms(ROOMS, { attendees: 6, equipment: ["projector", "speakers"] });
    const zenith = resolveSelectedRoom(matches, "zenith-z105");
    expect(zenith?.id).toBe("zenith-z105");

    expect(
      checkAvailability({
        start: 720,
        end: 780,
        currentMinutes: 540,
        room: zenith as Room,
      })
    ).toEqual({
      status: "unavailable",
      reasons: ["This room is blocked: Equipment maintenance."],
    });
  });

  test("selected matching rooms are checked against their own bookings", () => {
    const matches = filterRooms(ROOMS, { attendees: 12, equipment: ["projector", "whiteboard"] });
    const cedar = resolveSelectedRoom(matches, "cedar-c314");
    const orion = resolveSelectedRoom(matches, "orion-o202");
    expect(cedar?.id).toBe("cedar-c314");
    expect(orion?.id).toBe("orion-o202");

    const window = { start: 660, end: 720, currentMinutes: 540 };

    expect(checkAvailability({ ...window, room: cedar as Room }).status).toBe("available");
    expect(checkAvailability({ ...window, room: orion as Room }).status).toBe("unavailable");
  });
});
