import { describe, expect, test } from "vitest";
import {
  EXPLAIN_MOCK_UNAVAILABLE,
  explainAvailability,
  fallbackExplanation,
  isConsistent,
  reasonToCode,
  validateExplainInput,
  validateExplainOutput,
  type ExplainInput,
} from "@/lib/explain";

function makeInput(overrides: Partial<ExplainInput> = {}): ExplainInput {
  return {
    roomLabel: "Nova Study Room S-201",
    start: "11:00",
    end: "12:00",
    isAvailable: false,
    reasonCode: "overlap",
    ...overrides,
  };
}

describe("reasonToCode", () => {
  test("maps every concrete checker reason", () => {
    expect(reasonToCode("Times must satisfy 0 ≤ start < end ≤ 1440 (minutes from midnight).")).toBe("invalid-range");
    expect(reasonToCode("Start time must be strictly after the current time (09:00).")).toBe("past-time");
    expect(reasonToCode("A booking cannot be longer than 120 minutes.")).toBe("too-long");
    expect(reasonToCode("This room is blocked: Equipment maintenance.")).toBe("room-blocked");
    expect(reasonToCode("This room is currently blocked.")).toBe("room-blocked");
    expect(reasonToCode("Overlaps existing booking (10:00–11:00).")).toBe("overlap");
    expect(reasonToCode("Current time is missing or invalid.")).toBe("invalid-current-time");
  });

  test("maps unknown wording to unknown", () => {
    expect(reasonToCode("Something entirely new.")).toBe("unknown");
  });
});

describe("validateExplainInput", () => {
  test("accepts a valid input", () => {
    expect(validateExplainInput(makeInput())).toBeNull();
  });

  test("rejects blank and oversized room labels", () => {
    expect(validateExplainInput(makeInput({ roomLabel: "   " }))).not.toBeNull();
    expect(validateExplainInput(makeInput({ roomLabel: "R".repeat(81) }))).not.toBeNull();
    expect(validateExplainInput(makeInput({ roomLabel: "R".repeat(80) }))).toBeNull();
  });

  test("rejects malformed clock values", () => {
    for (const bad of ["", "9:00", "09:60", "24:00", "abc", "11:00 "]) {
      expect(validateExplainInput(makeInput({ start: bad }))).not.toBeNull();
      expect(validateExplainInput(makeInput({ end: bad }))).not.toBeNull();
    }
  });

  test("accepts a reversed or zero-length interval only for invalid-range", () => {
    expect(validateExplainInput(makeInput({ start: "12:00", end: "11:00", reasonCode: "invalid-range" }))).toBeNull();
    expect(validateExplainInput(makeInput({ start: "11:00", end: "11:00", reasonCode: "invalid-range" }))).toBeNull();
    expect(validateExplainInput(makeInput({ start: "12:00", end: "11:00", reasonCode: "overlap" }))).not.toBeNull();
  });

  test("rejects inconsistent status/reason pairs", () => {
    expect(validateExplainInput(makeInput({ isAvailable: true, reasonCode: "overlap" }))).not.toBeNull();
    expect(validateExplainInput(makeInput({ isAvailable: true, reasonCode: "available" }))).toBeNull();
    expect(validateExplainInput(makeInput({ isAvailable: false, reasonCode: "available" }))).not.toBeNull();
    expect(validateExplainInput(makeInput({ isAvailable: false, reasonCode: "unknown" }))).toBeNull();
  });
});

describe("validateExplainOutput", () => {
  test("accepts matching plain-text output and trims whitespace", () => {
    const input = makeInput();
    expect(validateExplainOutput({ explanation: "  Nova Study Room S-201 is booked during part of 11:00–12:00. " }, input)).toEqual({
      explanation: "Nova Study Room S-201 is booked during part of 11:00–12:00.",
    });
  });

  test("rejects malformed, empty, oversized or multi-sentence output", () => {
    const input = makeInput();
    expect(validateExplainOutput(null, input)).toBeNull();
    expect(validateExplainOutput({ explanation: 42 }, input)).toBeNull();
    expect(validateExplainOutput({ explanation: "   " }, input)).toBeNull();
    expect(validateExplainOutput({ explanation: "x".repeat(201) }, input)).toBeNull();
    expect(validateExplainOutput({ explanation: "One. Two. Three." }, input)).toBeNull();
  });

  test("rejects output that contradicts the status", () => {
    expect(
      validateExplainOutput({ explanation: "Nova Study Room S-201 is free from 11:00–12:00." }, makeInput({ isAvailable: false }))
    ).toBeNull();
    expect(
      validateExplainOutput({ explanation: "Nova Study Room S-201 cannot accept the requested time range." }, makeInput({ isAvailable: true, reasonCode: "available" }))
    ).toBeNull();
  });
});

describe("explainAvailability", () => {
  test("returns a validated mock explanation", async () => {
    const result = await explainAvailability(makeInput({ isAvailable: true, reasonCode: "available" }), { timeoutMs: 1000 });
    expect(result.explanation).toContain("Nova Study Room S-201 is free");
  });

  test("explains the invalid-current-time reason", async () => {
    const result = await explainAvailability(makeInput({ reasonCode: "invalid-current-time" }), { timeoutMs: 1000 });
    expect(result.explanation).toContain("current time is missing or invalid");
  });

  test("rejects invalid input before calling the mock", async () => {
    await expect(explainAvailability(makeInput({ roomLabel: "" }))).rejects.toThrow("Room label is required.");
  });

  test("falls back when the mock is unavailable", async () => {
    const input = makeInput({ roomLabel: EXPLAIN_MOCK_UNAVAILABLE });
    const result = await explainAvailability(input, { timeoutMs: 1000 });
    expect(result).toEqual(fallbackExplanation(input));
  });

  test("falls back deterministically on timeout", async () => {
    const input = makeInput();
    const [a, b] = await Promise.all([
      explainAvailability(input, { timeoutMs: 50 }),
      explainAvailability(input, { timeoutMs: 50 }),
    ]);
    expect(a).toEqual(b);
    expect(a).toEqual(fallbackExplanation(input));
  });
});

describe("isConsistent", () => {
  test("pairs availability with the right codes", () => {
    expect(isConsistent(true, "available")).toBe(true);
    expect(isConsistent(false, "invalid-range")).toBe(true);
    expect(isConsistent(false, "unknown")).toBe(true);
    expect(isConsistent(true, "overlap")).toBe(false);
    expect(isConsistent(false, "available")).toBe(false);
  });
});
