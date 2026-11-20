import { RotateCcw } from "lucide-react";

interface RoomFiltersProps {
  attendeesInput: string;
  attendeesError: string | null;
  equipmentOptions: string[];
  selectedEquipment: string[];
  matchCount: number;
  onAttendeesChange: (value: string) => void;
  onToggleEquipment: (item: string) => void;
  onReset: () => void;
}

export default function RoomFilters({
  attendeesInput,
  attendeesError,
  equipmentOptions,
  selectedEquipment,
  matchCount,
  onAttendeesChange,
  onToggleEquipment,
  onReset,
}: RoomFiltersProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Find a Room</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {matchCount} {matchCount === 1 ? "room matches" : "rooms match"} your requirements.
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-200 sm:self-auto"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset filters
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Attendees</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={attendeesInput}
            onChange={(e) => onAttendeesChange(e.target.value)}
            aria-invalid={attendeesError !== null}
            aria-describedby={attendeesError ? "attendees-error" : undefined}
            className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm text-slate-800 outline-none transition focus:ring-2 ${
              attendeesError
                ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
                : "border-slate-300 focus:border-sky-500 focus:ring-sky-200"
            }`}
          />
          {attendeesError && (
            <span id="attendees-error" className="mt-1 block text-xs text-rose-600">
              {attendeesError}
            </span>
          )}
        </label>

        <fieldset>
          <legend className="text-xs font-medium text-slate-600">Required equipment</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {equipmentOptions.map((item) => {
              const checked = selectedEquipment.includes(item);
              return (
                <label
                  key={item}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition focus-within:ring-2 focus-within:ring-sky-200 ${
                    checked
                      ? "border-sky-500 bg-sky-50 text-sky-800"
                      : "border-slate-300 text-slate-600 hover:border-slate-400"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleEquipment(item)}
                    className="h-3.5 w-3.5 accent-sky-600"
                  />
                  {item}
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>
    </div>
  );
}
