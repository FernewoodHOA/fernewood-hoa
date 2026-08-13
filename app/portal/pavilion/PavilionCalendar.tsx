"use client";

import { useMemo, useState } from "react";
import { formatTime } from "@/lib/reservations";

export type CalendarBooking = {
  id: string;
  event_date: string;
  starts_at: string;
  ends_at: string;
  requester_name: string;
  purpose: string;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// The timeline covers the hours a pavilion actually gets used. Anything
// outside this still appears in the list, it just isn't drawn on the grid.
const DAY_START_HOUR = 6;
const DAY_END_HOUR = 22;
const HOUR_HEIGHT = 44;

function iso(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function minutesFrom(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export default function PavilionCalendar({
  bookings,
  today,
  onPickDate,
}: {
  bookings: CalendarBooking[];
  today: string;
  onPickDate: (date: string) => void;
}) {
  const [year, setYear] = useState(() => Number(today.slice(0, 4)));
  const [month, setMonth] = useState(() => Number(today.slice(5, 7)) - 1);
  const [selected, setSelected] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarBooking[]>();
    for (const b of bookings) {
      const list = map.get(b.event_date) ?? [];
      list.push(b);
      map.set(b.event_date, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    }
    return map;
  }, [bookings]);

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function shift(delta: number) {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
    setSelected(null);
  }

  const selectedBookings = selected ? (byDate.get(selected) ?? []) : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          aria-label="Previous month"
          className="rounded-full border border-emerald-900/20 px-3 py-1.5 text-sm font-medium text-emerald-900 hover:bg-emerald-50"
        >
          &larr;
        </button>
        <h3 className="text-lg font-semibold text-emerald-950">
          {MONTHS[month]} {year}
        </h3>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label="Next month"
          className="rounded-full border border-emerald-900/20 px-3 py-1.5 text-sm font-medium text-emerald-900 hover:bg-emerald-50"
        >
          &rarr;
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-emerald-900/10 bg-white">
        <div className="grid grid-cols-7 border-b border-emerald-900/10 bg-emerald-50">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="px-1 py-2 text-center text-xs font-semibold text-emerald-900"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`pad-${i}`} className="min-h-[76px] bg-stone-50/60" />;
            }
            const date = iso(year, month, day);
            const dayBookings = byDate.get(date) ?? [];
            const isToday = date === today;
            const isPast = date < today;
            const isSelected = date === selected;

            return (
              <button
                key={date}
                type="button"
                onClick={() => setSelected(isSelected ? null : date)}
                className={[
                  "min-h-[76px] border-b border-r border-emerald-900/10 p-1 text-left align-top transition-colors",
                  isSelected ? "bg-emerald-100" : "hover:bg-emerald-50",
                  isPast ? "opacity-55" : "",
                ].join(" ")}
              >
                <span
                  className={
                    isToday
                      ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-800 text-xs font-bold text-white"
                      : "inline-block px-1 text-xs font-semibold text-stone-700"
                  }
                >
                  {day}
                </span>

                <span className="mt-1 flex flex-col gap-0.5">
                  {dayBookings.slice(0, 2).map((b) => (
                    <span
                      key={b.id}
                      className="truncate rounded bg-emerald-700 px-1 py-0.5 text-[10px] font-medium leading-tight text-white"
                      title={`${formatTime(b.starts_at)}–${formatTime(b.ends_at)} · ${b.requester_name}`}
                    >
                      {formatTime(b.starts_at).replace(":00", "")}
                    </span>
                  ))}
                  {dayBookings.length > 2 && (
                    <span className="px-1 text-[10px] text-stone-500">
                      +{dayBookings.length - 2} more
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="rounded-lg border border-emerald-900/10 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="font-semibold text-emerald-950">
              {new Date(
                Number(selected.slice(0, 4)),
                Number(selected.slice(5, 7)) - 1,
                Number(selected.slice(8, 10))
              ).toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h4>
            {selected >= today && (
              <button
                type="button"
                onClick={() => onPickDate(selected)}
                className="rounded-full bg-emerald-800 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-900"
              >
                Request this day
              </button>
            )}
          </div>

          <p className="mt-1 text-sm text-stone-600">
            {selectedBookings.length === 0
              ? "Nothing booked — the whole day is free."
              : "Shaded blocks are taken. Any gap is available."}
          </p>

          {/* Hour-by-hour timeline so a free afternoon is obvious at a glance. */}
          <div className="mt-3 flex gap-2">
            <div className="flex flex-col">
              {Array.from(
                { length: DAY_END_HOUR - DAY_START_HOUR },
                (_, i) => DAY_START_HOUR + i
              ).map((h) => (
                <div
                  key={h}
                  style={{ height: HOUR_HEIGHT }}
                  className="pr-1 text-right text-[10px] leading-none text-stone-500"
                >
                  {h % 12 === 0 ? 12 : h % 12}
                  {h < 12 ? "am" : "pm"}
                </div>
              ))}
            </div>

            <div
              className="relative flex-1 rounded border border-emerald-900/10 bg-stone-50"
              style={{ height: (DAY_END_HOUR - DAY_START_HOUR) * HOUR_HEIGHT }}
            >
              {Array.from(
                { length: DAY_END_HOUR - DAY_START_HOUR },
                (_, i) => i
              ).map((i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 border-t border-emerald-900/5"
                  style={{ top: i * HOUR_HEIGHT }}
                />
              ))}

              {selectedBookings.map((b) => {
                const startMin = minutesFrom(b.starts_at);
                const endMin = minutesFrom(b.ends_at);
                const top =
                  ((startMin - DAY_START_HOUR * 60) / 60) * HOUR_HEIGHT;
                const height = ((endMin - startMin) / 60) * HOUR_HEIGHT;
                return (
                  <div
                    key={b.id}
                    className="absolute left-1 right-1 overflow-hidden rounded bg-emerald-700 px-2 py-1 text-xs text-white"
                    style={{
                      top: Math.max(0, top),
                      height: Math.max(18, height),
                    }}
                  >
                    <span className="block truncate font-semibold">
                      {formatTime(b.starts_at)} – {formatTime(b.ends_at)}
                    </span>
                    <span className="block truncate">
                      {b.requester_name} · {b.purpose}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
