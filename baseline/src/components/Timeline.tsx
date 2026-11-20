import type { Booking } from "@/lib/roomData";
import { getTimelineRange, minutesToLabel } from "@/lib/availability";

interface TimelineProps {
  bookings: Booking[];
  blocked: boolean;
  currentMinutes: number;
  candidate: { start: number; end: number } | null;
}

export default function Timeline({ bookings, blocked, currentMinutes, candidate }: TimelineProps) {
  const intervals = candidate ? [...bookings, candidate] : bookings;
  const { start: rangeStart, end: rangeEnd } = getTimelineRange(intervals);
  const span = rangeEnd - rangeStart;
  const labelStep = span <= 540 ? 60 : span <= 960 ? 120 : 240;
  const pct = (min: number) => Math.max(0, Math.min(100, ((min - rangeStart) / span) * 100));

  const ticks: number[] = [];
  for (let t = rangeStart; t <= rangeEnd; t += 60) {
    ticks.push(t);
  }

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Daily Schedule ({minutesToLabel(rangeStart)}–{minutesToLabel(rangeEnd)})
        </h4>
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-sky-500" /> Now
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-slate-400" /> Booked
          </span>
          {candidate && (
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-sm bg-emerald-400" /> Candidate
            </span>
          )}
        </div>
      </div>
      <div className="relative h-12 rounded-lg bg-slate-100">
        {bookings.map((b, i) => {
          const left = pct(b.start);
          const right = pct(b.end);
          const width = Math.max(2, right - left);
          return (
            <div
              key={i}
              className="absolute top-0 flex h-12 items-center justify-center overflow-hidden rounded-md bg-slate-400/80 px-1 text-[9px] font-semibold text-white"
              style={{ left: `${left}%`, width: `${width}%` }}
              title={`Booked ${minutesToLabel(b.start)}–${minutesToLabel(b.end)}`}
            >
              {minutesToLabel(b.start)}–{minutesToLabel(b.end)}
            </div>
          );
        })}
        {candidate && (
          <div
            className="absolute top-0 h-12 rounded-md border-2 border-dashed border-emerald-500 bg-emerald-300/30"
            style={{
              left: `${pct(candidate.start)}%`,
              width: `${Math.max(2, pct(candidate.end) - pct(candidate.start))}%`,
            }}
          />
        )}
        {currentMinutes >= rangeStart && currentMinutes <= rangeEnd && (
          <div
            className="absolute top-0 z-10 h-12 w-0.5 bg-sky-500"
            style={{ left: `${pct(currentMinutes)}%` }}
            title={`Now: ${minutesToLabel(currentMinutes)}`}
          />
        )}
        {blocked && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-rose-100/60">
            <span className="text-xs font-semibold text-rose-600">Room Blocked</span>
          </div>
        )}
        {ticks.map((t) => (
          <div
            key={t}
            className="absolute flex flex-col items-center"
            style={{ left: `${pct(t)}%` }}
          >
            <div className="h-2 w-px bg-slate-300" />
            {(t === rangeEnd || ((t - rangeStart) % labelStep === 0 && rangeEnd - t >= labelStep)) && (
              <span className="mt-1 -translate-x-1/2 text-[9px] font-medium text-slate-400">
                {minutesToLabel(t)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
