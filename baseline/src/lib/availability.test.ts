import { describe, expect, test } from "vitest";
import { checkAvailability, getTimelineRange, type CheckInput } from "@/lib/availability";
import type { Booking, Room } from "@/lib/roomData";

const defaultBookings: Booking[] = [{ start: 600, end: 660 }];

function createInput(overrides: Partial<CheckInput> = {}): CheckInput {
  const room: Room = {
    id: "test-room",
    name: "Test Room",
    location: "Test Building",
    capacity: 8,
    equipment: [],
    blocked: false,
    bookings: defaultBookings.map((booking) => ({ ...booking })),
  };

  return {
    start: 720,
    end: 780,
    currentMinutes: 540,
    room,
    ...overrides,
  };
}

function isAvailable(input: CheckInput): boolean {
  return checkAvailability(input).status === "available";
}

describe("checkAvailability assignment cases", () => {
  test("T01 allows a booking that touches an existing booking after it", () => {
    expect(isAvailable(createInput({ start: 660, end: 720 }))).toBe(true);
  });

  test("T02 rejects a booking that starts at the current time", () => {
    expect(isAvailable(createInput({ start: 540, end: 570 }))).toBe(false);
  });

  test("T03 rejects a zero-duration booking", () => {
    expect(isAvailable(createInput({ start: 720, end: 720 }))).toBe(false);
  });

  test("T04 rejects a reversed time range", () => {
    expect(isAvailable(createInput({ start: 750, end: 720 }))).toBe(false);
  });

  test("T05 rejects a range that ends after the day", () => {
    expect(isAvailable(createInput({ start: 1380, end: 1441 }))).toBe(false);
  });

  test("T06 allows a booking lasting exactly 120 minutes", () => {
    expect(isAvailable(createInput({ start: 720, end: 840 }))).toBe(true);
  });

  test("T07 rejects a booking lasting 121 minutes", () => {
    expect(isAvailable(createInput({ start: 720, end: 841 }))).toBe(false);
  });

  test("T08 allows a booking that touches an existing booking before it", () => {
    expect(isAvailable(createInput({ start: 570, end: 600 }))).toBe(true);
  });

  test("T09 rejects a partial overlap", () => {
    expect(isAvailable(createInput({ start: 630, end: 690 }))).toBe(false);
  });

  test("T10 rejects a range that contains an existing booking", () => {
    expect(isAvailable(createInput({ start: 570, end: 690 }))).toBe(false);
  });

  test("T11 rejects a range inside an existing booking", () => {
    expect(
      isAvailable(
        createInput({
          start: 615,
          end: 645,
        })
      )
    ).toBe(false);
  });

  test("T12 rejects an identical booking interval", () => {
    expect(isAvailable(createInput({ start: 600, end: 660 }))).toBe(false);
  });

  test("T13 rejects a booking in a blocked room", () => {
    expect(
      isAvailable(
        createInput({
          start: 660,
          end: 720,
          room: {
            ...createInput().room,
            blocked: true,
            blockReason: "Equipment maintenance",
          },
        })
      )
    ).toBe(false);
  });

  test("T14 allows a non-overlapping booking when there are no existing bookings", () => {
    expect(
      isAvailable(
        createInput({
          room: { ...createInput().room, bookings: [] },
          start: 630,
          end: 690,
        })
      )
    ).toBe(true);
  });

  test("T15 rejects a request when the current time is empty (NaN)", () => {
    const cedarBookings: Booking[] = [
      { start: 570, end: 600 },
      { start: 900, end: 960 },
    ];
    const result = checkAvailability(
      createInput({
        room: { ...createInput().room, bookings: cedarBookings },
        start: 660,
        end: 720,
        currentMinutes: Number.NaN,
      })
    );

    expect(result).toEqual({
      status: "unavailable",
      reasons: ["Current time is missing or invalid."],
    });
  });

  test("T16 rejects out-of-range or non-integer current times and accepts midnight", () => {
    for (const currentMinutes of [-1, 1440, 1500, Number.POSITIVE_INFINITY, 540.5]) {
      expect(checkAvailability(createInput({ currentMinutes }))).toEqual({
        status: "unavailable",
        reasons: ["Current time is missing or invalid."],
      });
    }

    expect(isAvailable(createInput({ start: 60, end: 90, currentMinutes: 0 }))).toBe(true);
  });

  test("preserves the original booking data", () => {
    const bookings: Booking[] = [{ start: 600, end: 660 }];
    const input = createInput({ room: { ...createInput().room, bookings } });
    const before = JSON.stringify(bookings);

    checkAvailability(input);

    expect(JSON.stringify(bookings)).toBe(before);
    expect(input.room.bookings).toBe(bookings);
  });

  
  test("rejects a negative start time at the lower boundary", () => {
    expect(
      checkAvailability(createInput({ start: -1, end: 60, currentMinutes: 0 }))
    ).toMatchObject({
      status: "unavailable",
      reasons: expect.arrayContaining([
        expect.stringContaining("Times must satisfy"),
      ]),
    });
  });


  test("allows a valid booking ending exactly at midnight", () => {
    expect(isAvailable(createInput({ start: 1320, end: 1440 }))).toBe(true);
  });

  test("rejects missing start or end input", () => {
    expect(isAvailable(createInput({ start: Number.NaN }))).toBe(false);
    expect(isAvailable(createInput({ end: Number.NaN }))).toBe(false);
  });
});

describe("getTimelineRange", () => {
  test("keeps the daytime window when every interval fits", () => {
    expect(getTimelineRange([{ start: 660, end: 720 }])).toEqual({ start: 480, end: 1020 });
  });

  test("extends to cover an evening candidate", () => {
    expect(getTimelineRange([{ start: 1080, end: 1140 }])).toEqual({ start: 480, end: 1140 });
  });

  test("extends earlier for an early-morning interval", () => {
    expect(getTimelineRange([{ start: 420, end: 450 }])).toEqual({ start: 420, end: 1020 });
  });

  test("rounds to whole hours and never passes midnight", () => {
    expect(getTimelineRange([{ start: 1090, end: 1130 }])).toEqual({ start: 480, end: 1140 });
    expect(getTimelineRange([{ start: 1400, end: 1440 }])).toEqual({ start: 480, end: 1440 });
  });
});
