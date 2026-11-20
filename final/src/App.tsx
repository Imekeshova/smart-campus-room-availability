import { useRef, useState } from "react";
import { MapPin, Users, Lock, Search, Clock, SearchX } from "lucide-react";
import { ROOMS, DEFAULT_CURRENT_TIME } from "@/lib/roomData";
import {
  checkAvailability,
  minutesToLabel,
  labelToMinutes,
  type CheckOutcome,
} from "@/lib/availability";
import {
  explainAvailability,
  fallbackExplanation,
  reasonToCode,
  validateExplainInput,
  type ExplainInput,
} from "@/lib/explain";
import {
  filterRooms,
  getEquipmentOptions,
  isValidAttendeeCount,
  parseAttendees,
  resolveSelectedRoom,
} from "@/lib/roomFiltering";
import RoomCard from "@/components/RoomCard";
import RoomFilters from "@/components/RoomFilters";
import Timeline from "@/components/Timeline";
import ResultBanner from "@/components/ResultBanner";

const EQUIPMENT_OPTIONS = getEquipmentOptions(ROOMS);
const DEFAULT_ATTENDEES = "1";

type ExplainState = "idle" | "loading" | "mock" | "fallback";

interface LastCheck {
  roomLabel: string;
  start: string;
  end: string;
  isAvailable: boolean;
  reasonCode: ExplainInput["reasonCode"];
}

export default function App() {
  const [attendeesInput, setAttendeesInput] = useState(DEFAULT_ATTENDEES);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(ROOMS[0].id);
  const [startTime, setStartTime] = useState("11:00");
  const [endTime, setEndTime] = useState("12:00");
  const [currentTime, setCurrentTime] = useState(minutesToLabel(DEFAULT_CURRENT_TIME));
  const [outcome, setOutcome] = useState<CheckOutcome | null>(null);
  const [lastCheck, setLastCheck] = useState<LastCheck | null>(null);
  const [explainState, setExplainState] = useState<ExplainState>("idle");
  const [explanation, setExplanation] = useState<string | null>(null);
  const explainRequestRef = useRef(0);

  const attendees = parseAttendees(attendeesInput);
  const attendeesError = isValidAttendeeCount(attendees)
    ? null
    : "Enter a whole number of 1 or more.";
  const matches = filterRooms(ROOMS, { attendees, equipment: selectedEquipment });
  const room = resolveSelectedRoom(matches, selectedRoomId);
  const currentMinutes = labelToMinutes(currentTime);
  const startMin = labelToMinutes(startTime);
  const endMin = labelToMinutes(endTime);

  const candidate =
    !isNaN(startMin) && !isNaN(endMin) && startMin < endMin
      ? { start: startMin, end: endMin }
      : null;

  const clearExplanation = () => {
    explainRequestRef.current += 1;
    setExplainState("idle");
    setExplanation(null);
  };

  const applyFilters = (nextAttendeesInput: string, nextEquipment: string[]) => {
    const nextMatches = filterRooms(ROOMS, {
      attendees: parseAttendees(nextAttendeesInput),
      equipment: nextEquipment,
    });
    setAttendeesInput(nextAttendeesInput);
    setSelectedEquipment(nextEquipment);
    setSelectedRoomId(resolveSelectedRoom(nextMatches, selectedRoomId)?.id ?? null);
    setOutcome(null);
    setLastCheck(null);
    clearExplanation();
  };

  const handleToggleEquipment = (item: string) => {
    const nextEquipment = selectedEquipment.includes(item)
      ? selectedEquipment.filter((existing) => existing !== item)
      : [...selectedEquipment, item];
    applyFilters(attendeesInput, nextEquipment);
  };

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;
    const result = checkAvailability({ start: startMin, end: endMin, currentMinutes, room });
    setOutcome(result);
    clearExplanation();
    const firstReason = result.status === "available" ? null : result.reasons[0];
    setLastCheck({
      roomLabel: room.name,
      start: startTime,
      end: endTime,
      isAvailable: result.status === "available",
      reasonCode: firstReason ? reasonToCode(firstReason) : result.status === "available" ? "available" : "unknown",
    });
  };

  const handleRoomSelect = (id: string) => {
    setSelectedRoomId(id);
    setOutcome(null);
    setLastCheck(null);
    clearExplanation();
  };

  const handleExplain = () => {
    if (!lastCheck) return;
    const input: ExplainInput = lastCheck;
    const token = explainRequestRef.current + 1;
    explainRequestRef.current = token;

    if (validateExplainInput(input)) {
      setExplainState("fallback");
      setExplanation(fallbackExplanation(input).explanation);
      return;
    }

    setExplainState("loading");
    setExplanation(null);
    explainAvailability(input).then((result) => {
      if (explainRequestRef.current !== token) return;
      const isFallback = result.explanation === fallbackExplanation(input).explanation;
      setExplainState(isFallback ? "fallback" : "mock");
      setExplanation(result.explanation);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-4 sm:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-600 text-white">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 sm:text-lg">
              Smart Campus · Room Availability
            </h1>
            <p className="text-xs text-slate-500">
              Check whether a room is open for your chosen time. No booking is saved.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        {/* Filters and room selection */}
        <section className="space-y-4">
          <RoomFilters
            attendeesInput={attendeesInput}
            attendeesError={attendeesError}
            equipmentOptions={EQUIPMENT_OPTIONS}
            selectedEquipment={selectedEquipment}
            matchCount={matches.length}
            onAttendeesChange={(value) => applyFilters(value, selectedEquipment)}
            onToggleEquipment={handleToggleEquipment}
            onReset={() => applyFilters(DEFAULT_ATTENDEES, [])}
          />

          <div>
            <h2 className="mb-3 text-sm font-bold text-slate-800">Select a Room</h2>
            {matches.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-5">
                <SearchX className="h-5 w-5 shrink-0 text-slate-400" />
                <p className="text-sm text-slate-600">No rooms match your requirements.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {matches.map((r) => (
                  <RoomCard
                    key={r.id}
                    room={r}
                    selected={r.id === room?.id}
                    onSelect={() => handleRoomSelect(r.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {room && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{room.name}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {room.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {room.capacity} seats
                  </span>
                  <span className="flex items-center gap-1">
                    {room.blocked ? (
                      <Lock className="h-3.5 w-3.5 text-rose-500" />
                    ) : (
                      <Clock className="h-3.5 w-3.5 text-emerald-500" />
                    )}
                    {room.blocked ? `Blocked: ${room.blockReason}` : "Open"}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="mt-6">
              <Timeline
                bookings={room.bookings}
                blocked={room.blocked}
                currentMinutes={currentMinutes}
                candidate={candidate}
              />
            </div>

            {/* Existing bookings (read-only) */}
            <div className="mt-5 rounded-lg bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Existing Bookings (read-only)
              </p>
              {room.bookings.length === 0 ? (
                <p className="mt-1.5 text-xs text-slate-500">No existing bookings.</p>
              ) : (
                <ul className="mt-1.5 space-y-1">
                  {room.bookings.map((b, i) => (
                    <li key={i} className="text-xs text-slate-600">
                      {minutesToLabel(b.start)}–{minutesToLabel(b.end)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {/* Time input form */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-sm font-bold text-slate-800">Check a Time Range</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Choose start and end times. The current time is set to 09:00 by default for testing.
          </p>

          <form onSubmit={handleCheck} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              <label className="block">
                <span className="text-xs font-medium text-slate-600">Start time</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setOutcome(null);
                    setLastCheck(null);
                    clearExplanation();
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-slate-600">End time</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    setOutcome(null);
                    setLastCheck(null);
                    clearExplanation();
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-slate-600">
                  Current time (for testing)
                </span>
                <input
                  type="time"
                  value={currentTime}
                  onChange={(e) => {
                    setCurrentTime(e.target.value);
                    setOutcome(null);
                    setLastCheck(null);
                    clearExplanation();
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                />
              </label>
            </div>

            {candidate && (
              <p className="text-xs text-slate-500">
                Selected: {minutesToLabel(startMin)} – {minutesToLabel(endMin)} ({endMin - startMin} min)
              </p>
            )}

            <button
              type="submit"
              disabled={!room}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:hover:bg-slate-200 sm:w-auto"
            >
              <Search className="h-4 w-4" />
              Check Availability
            </button>
          </form>

          <div className="mt-5">
            <ResultBanner outcome={outcome} />
          </div>

          {outcome && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Explanation (local mock)
                </p>
                {lastCheck && explainState !== "loading" && (
                  <button
                    type="button"
                    onClick={handleExplain}
                    className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-sky-400 hover:text-sky-700"
                  >
                    Explain availability
                  </button>
                )}
              </div>
              {explainState === "loading" && (
                <p className="mt-1.5 text-xs text-slate-500">Generating explanation…</p>
              )}
              {explanation && (
                <p className="mt-1.5 text-xs text-slate-600">
                  {explainState === "fallback" && (
                    <span className="font-semibold text-slate-500">Rule-based explanation: </span>
                  )}
                  {explanation}
                </p>
              )}
              <p className="mt-1.5 text-[10px] text-slate-400">
                Generated from the last check only. Availability does not mean a booking was created.
              </p>
            </div>
          )}
        </section>
      </main>

      <footer className="mx-auto max-w-4xl px-4 pb-8 text-center text-[10px] text-slate-400 sm:px-6">
        All data is fictional. No booking is saved.
      </footer>
    </div>
  );
}
