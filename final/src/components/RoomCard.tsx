import { MapPin, Users, Lock, LockOpen } from "lucide-react";
import type { Room } from "@/lib/roomData";

interface RoomCardProps {
  room: Room;
  selected: boolean;
  onSelect: () => void;
}

export default function RoomCard({ room, selected, onSelect }: RoomCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group w-full rounded-xl border p-4 text-left transition-all ${
        selected
          ? "border-sky-500 bg-sky-50 ring-2 ring-sky-200"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">{room.name}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="h-3 w-3 shrink-0" />
            {room.location}
          </p>
        </div>
        <span
          className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            room.blocked
              ? "bg-rose-100 text-rose-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {room.blocked ? <Lock className="h-3 w-3" /> : <LockOpen className="h-3 w-3" />}
          {room.blocked ? "Blocked" : "Open"}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {room.capacity} seats
        </span>
        <span className="text-slate-300">·</span>
        <span>{room.bookings.length} existing booking{room.bookings.length !== 1 ? "s" : ""}</span>
      </div>
      {room.equipment.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {room.equipment.map((item) => (
            <li
              key={item}
              className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium capitalize text-slate-600"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </button>
  );
}
