export type ReasonCode =
  | "invalid-range"
  | "past-time"
  | "too-long"
  | "room-blocked"
  | "overlap"
  | "invalid-current-time"
  | "available"
  | "unknown";

export interface ExplainInput {
  roomLabel: string;
  start: string;
  end: string;
  isAvailable: boolean;
  reasonCode: ReasonCode;
}

export interface ExplainOutput {
  explanation: string;
}

const MAX_ROOM_LABEL = 80;
const MAX_EXPLANATION = 200;
const MAX_SENTENCES = 2;
const MOCK_DELAY_MS = 300;
const TIMEOUT_MS = 1500;

const CLOCK_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const EXPLAIN_MOCK_UNAVAILABLE = "explain-mock-unavailable";

function toMinutes(label: string): number {
  const [h, m] = label.split(":").map(Number);
  return h * 60 + m;
}

export function reasonToCode(reason: string): ReasonCode {
  if (reason.startsWith("Times must satisfy")) return "invalid-range";
  if (reason.startsWith("Start time must be strictly after")) return "past-time";
  if (reason.startsWith("A booking cannot be longer")) return "too-long";
  if (reason.startsWith("This room is currently blocked") || reason.startsWith("This room is blocked")) {
    return "room-blocked";
  }
  if (reason.startsWith("Overlaps existing booking")) return "overlap";
  if (reason === "Current time is missing or invalid.") return "invalid-current-time";
  return "unknown";
}

export function isConsistent(isAvailable: boolean, reasonCode: ReasonCode): boolean {
  if (isAvailable) return reasonCode === "available";
  return reasonCode !== "available";
}

export function validateExplainInput(input: ExplainInput): string | null {
  if (typeof input !== "object" || input === null) return "Malformed input.";
  const { roomLabel, start, end, isAvailable, reasonCode } = input;

  if (typeof roomLabel !== "string" || roomLabel.trim() === "") return "Room label is required.";
  if (roomLabel.length > MAX_ROOM_LABEL) return "Room label is too long.";

  if (typeof start !== "string" || !CLOCK_RE.test(start)) return "Start time must be a valid HH:mm clock value.";
  if (typeof end !== "string" || !CLOCK_RE.test(end)) return "End time must be a valid HH:mm clock value.";

  if (toMinutes(start) >= toMinutes(end)) {
    // Reversed or zero-length intervals stay explainable when the checker
    // reported them; only reject when it disagrees.
    if (reasonCode !== "invalid-range") return "Start and end times are inconsistent with the reported reason.";
  }

  if (typeof isAvailable !== "boolean") return "Availability must be a boolean.";
  if (!isConsistent(isAvailable, reasonCode)) return "Status and reason code are inconsistent.";

  return null;
}

function sanitize(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
}

function countSentences(text: string): number {
  return text.split(/[.!?]+/).filter((s) => s.trim() !== "").length;
}

export function validateExplainOutput(
  output: unknown,
  input: ExplainInput
): ExplainOutput | null {
  if (typeof output !== "object" || output === null) return null;
  const { explanation } = output as { explanation?: unknown };
  if (typeof explanation !== "string") return null;

  const clean = sanitize(explanation);
  if (clean === "") return null;
  if (clean.length > MAX_EXPLANATION) return null;
  if (countSentences(clean) > MAX_SENTENCES) return null;

  // Wording agreement: a free-slot claim must not appear in an unavailable
  // explanation and rejection wording must not appear in an available one.
  const contradictory = input.isAvailable
    ? /cannot|not be booked|blocked|overlaps|invalid|exceeds|not after|booked during/i
    : /\bis free\b|\bis available\b|can be booked/i;
  if (contradictory.test(clean)) return null;

  return { explanation: clean };
}

export function fallbackExplanation(input: ExplainInput): ExplainOutput {
  const room = input.roomLabel.trim();
  const from = `${room}: `;
  if (input.isAvailable) {
    return { explanation: sanitize(`${from}the room is free in this time slot.`) };
  }
  switch (input.reasonCode) {
    case "invalid-range":
      return { explanation: sanitize(`${from}the time range is invalid, so it cannot be booked.`) };
    case "past-time":
      return { explanation: sanitize(`${from}the start time is not after the current time.`) };
    case "too-long":
      return { explanation: sanitize(`${from}the requested booking exceeds 120 minutes.`) };
    case "room-blocked":
      return { explanation: sanitize(`${from}the room is currently blocked.`) };
    case "overlap":
      return { explanation: sanitize(`${from}the time range overlaps an existing booking.`) };
    case "invalid-current-time":
      return { explanation: sanitize(`${from}the current time is missing or invalid.`) };
    default:
      return { explanation: sanitize(`${from}the time range cannot be booked.`) };
  }
}

async function runMock(input: ExplainInput): Promise<ExplainOutput> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  if (input.roomLabel.trim().toLowerCase() === EXPLAIN_MOCK_UNAVAILABLE) {
    throw new Error("mock unavailable");
  }

  const room = input.roomLabel.trim();
  const slot = `${input.start}–${input.end}`;
  switch (input.reasonCode) {
    case "available":
      return { explanation: `${room} is free from ${slot}.` };
    case "invalid-range":
      return { explanation: `${room} rejected the range ${slot} because start and end times are invalid.` };
    case "past-time":
      return { explanation: `${room} rejected ${slot} because the start time is not after the current time.` };
    case "too-long":
      return { explanation: `${room} rejected ${slot} because bookings are limited to 120 minutes.` };
    case "room-blocked":
      return { explanation: `${room} is blocked, so ${slot} cannot be booked.` };
    case "overlap":
      return { explanation: `${room} is booked during part of ${slot}.` };
    case "invalid-current-time":
      return { explanation: `${room} cannot be checked because the current time is missing or invalid.` };
    default:
      return { explanation: `${room} cannot accept the requested time range.` };
  }
}

export async function explainAvailability(
  input: ExplainInput,
  options: { timeoutMs?: number } = {}
): Promise<ExplainOutput> {
  const validationError = validateExplainInput(input);
  if (validationError) throw new Error(validationError);

  const timeoutMs = options.timeoutMs ?? TIMEOUT_MS;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("timeout")), timeoutMs);
  });

  try {
    const result = await Promise.race([runMock(input), timeout]);
    const validated = validateExplainOutput(result, input);
    return validated ?? fallbackExplanation(input);
  } catch {
    return fallbackExplanation(input);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
