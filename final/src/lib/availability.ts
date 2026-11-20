import type { Room } from "@/lib/roomData";

export type CheckOutcome =
  | { status: "available" }
  | { status: "unavailable"; reasons: string[] };

export interface CheckInput {
  start: number;
  end: number;
  currentMinutes: number;
  room: Room;
}

const MAX_BOOKING_MINUTES = 120;
const MINUTES_IN_DAY = 1440;
const TIMELINE_DEFAULT_START = 480;
const TIMELINE_DEFAULT_END = 1020;

export function checkAvailability(input: CheckInput): CheckOutcome {
  const { start, end, currentMinutes, room } = input;
  const reasons: string[] = [];

  if (isNaN(start) || isNaN(end)) {
    return { status: "unavailable", reasons: ["Start and end times are required."] };
  }

  if (!Number.isInteger(currentMinutes) || currentMinutes < 0 || currentMinutes >= MINUTES_IN_DAY) {
    return { status: "unavailable", reasons: ["Current time is missing or invalid."] };
  }

  if (start < 0 || end > MINUTES_IN_DAY || start >= end) {
    reasons.push("Times must satisfy 0 ≤ start < end ≤ 1440 (minutes from midnight).");
  }

  if (start <= currentMinutes) {
    reasons.push(`Start time must be strictly after the current time (${minutesToLabel(currentMinutes)}).`);
  }

  if (end - start > MAX_BOOKING_MINUTES) {
    reasons.push("A booking cannot be longer than 120 minutes.");
  }

  if (room.blocked) {
    reasons.push(
      room.blockReason
        ? `This room is blocked: ${room.blockReason}.`
        : "This room is currently blocked."
    );
  }

  for (const b of room.bookings) {
    if (start < b.end && end > b.start) {
      reasons.push(`Overlaps existing booking (${minutesToLabel(b.start)}–${minutesToLabel(b.end)}).`);
      break;
    }
  }

  return reasons.length === 0
    ? { status: "available" }
    : { status: "unavailable", reasons };
}

export function minutesToLabel(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function labelToMinutes(label: string): number {
  const [h, m] = label.split(":").map(Number);
  return h * 60 + m;
}

export function getTimelineRange(intervals: { start: number; end: number }[]): { start: number; end: number } {
  const start = Math.min(TIMELINE_DEFAULT_START, ...intervals.map((i) => i.start));
  const end = Math.max(TIMELINE_DEFAULT_END, ...intervals.map((i) => i.end));
  return {
    start: Math.max(0, Math.floor(start / 60) * 60),
    end: Math.min(MINUTES_IN_DAY, Math.ceil(end / 60) * 60),
  };
}
