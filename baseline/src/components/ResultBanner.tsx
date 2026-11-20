import { CheckCircle2, XCircle, Info } from "lucide-react";
import type { CheckOutcome } from "@/lib/availability";

interface ResultBannerProps {
  outcome: CheckOutcome | null;
}

export default function ResultBanner({ outcome }: ResultBannerProps) {
  if (!outcome) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <Info className="h-5 w-5 shrink-0 text-slate-400" />
        <span className="text-sm text-slate-500">
          Select a room, enter start and end times, then check availability.
        </span>
      </div>
    );
  }

  if (outcome.status === "available") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">Available</p>
          <p className="text-xs text-emerald-700">
            This time range is open and can be booked.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
      <div className="flex items-center gap-3">
        <XCircle className="h-6 w-6 shrink-0 text-rose-600" />
        <div>
          <p className="text-sm font-semibold text-rose-800">Unavailable</p>
          <p className="text-xs text-rose-700">This time range cannot be booked.</p>
        </div>
      </div>
      <ul className="mt-3 space-y-1 pl-9">
        {outcome.reasons.map((reason, i) => (
          <li key={i} className="text-xs text-rose-700">
            — {reason}
          </li>
        ))}
      </ul>
    </div>
  );
}
